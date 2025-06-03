const sessionService = require("../services/session.service");
const dbService = require("../services/db.service");

// Handle poll creation
const handlePoll = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  if (!session.stage) return;
  const poll = ctx.message.poll;
  if (poll.is_anonymous) {
    return ctx.reply(
      "❌ This bot can't create anonymous polls. Please send a non-anonymous poll."
    );
  }
  if (session.stage === "awaiting_quiz_poll") {
    let question;
    if (/^\[\d+\/\d+\]/.test(poll.question)) {
      question = poll.question.replace(/^\[\d+\/\d+\]\s*/, "");
    } else {
      question = poll.question;
    }
    session.quiz.push({
      question: question,
      options: poll.options.map((option) => option.text),
      correctOption: poll.correct_option_id,
      explanation: poll.explanation,
    });
    const numOfQuestions = session.quiz.length;
    sessionService.updateSession(userId, { stage: "awaiting_quiz_poll" });
    console.log(session);

    return ctx.reply(
      `Good. Your quiz "<b>${
        session.quizTitle
      }</b>" now has ${numOfQuestions} question${
        numOfQuestions > 1 ? "s" : ""
      }.\n\nIf you made a mistake in the question, you can go back by sending /undo.\n\nNow send the next question.\n\nWhen done, simply send /done to finish creating the quiz.`,
      { parse_mode: "HTML" }
    );
  }
};

// Handle poll answer
const handlePollAnswer = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  if (!session || session.stage !== "start_quiz") return;

  const pollAnswer = ctx.pollAnswer;
  const currentQuestion = session.questions[session.currentQuestionIndex];

  // Store answer in session
  sessionService.addQuizAnswer(userId, {
    questionId: currentQuestion.id,
    selectedIndex: pollAnswer.option_ids[0],
    isCorrect: pollAnswer.option_ids[0] === currentQuestion.correct_option,
  });

  // Move to next question
  session.currentQuestionIndex++;

  // Check if quiz is complete
  if (session.currentQuestionIndex >= session.questions.length) {
    // Save all answers to database
    try {
      const answers = sessionService.getQuizAnswers(userId);
      for (const answer of answers) {
        await dbService.submitAnswer(
          userId,
          session.currentQuiz.id,
          answer.questionId,
          answer.selectedIndex,
          answer.isCorrect
        );
      }

      // Calculate final score
      const userScore = session.score;
      const totalQuestions = answers.length;

      // Reset session
      sessionService.resetSession(userId);

      // Send completion message using the stored chat ID
      return ctx.telegram.sendMessage(
        session.chatId,
        `🎉 Quiz completed!\n\nYour score: ${userScore}/${totalQuestions} correct answers.`,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.error("Error saving quiz answers:", err);
      return ctx.telegram.sendMessage(
        session.chatId,
        "⚠️ Failed to save quiz results. Please try again later."
      );
    }
  }

  // Send next question using the stored chat ID
  const questionNumber = sessionService.getCurrentQuestionNumber(ctx.from.id);
  const questionData = session.questions[session.currentQuestionIndex];
  const questionText = `${questionNumber} ${questionData.question}`;
  let options = questionData.options;
  const correctOptionId = questionData.correct_option;
  try {
    // Check if any option is too long
    const isOptionsTooLong = options.some((option) => option.length >= 100);
    // If questionText is too long, send it as a separate message first
    if (questionData.question.length >= 300 || isOptionsTooLong) {
      const length = options.length;
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      const newOptions = options.map((option, index) => {
        return `<b>${letters[index]}.</b> ${option}`;
      });

      // Update options array directly to just the labels (A, B, C, ...)
      for (let i = 0; i < length; i++) {
        options[i] = `${letters[i]}`;
      }

      await ctx.telegram.sendMessage(
        session.chatId,
        `<b>${questionNumber}</b> ${
          questionData.question
        }\n\nOptions:\n${newOptions.join("\n")}`,
        { parse_mode: "HTML" }
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Send the poll with modified question text if needed
    await ctx.telegram.sendPoll(
      session.chatId,
      questionData.question.length >= 300 || isOptionsTooLong
        ? `${questionNumber} Question provided above`
        : questionText,
      options,
      {
        type: "quiz",
        correct_option_id: correctOptionId,
        is_anonymous: false,
        explanation:
          questionData.explanation && questionData.explanation.length < 200
            ? questionData.explanation
            : undefined,
        open_period: session.currentQuiz.timer_seconds || 60,
      }
    );
  } catch (err) {
    console.error("Failed to send quiz question:", err);
    await ctx.telegram.sendMessage(session.chatId, "⚠️ Failed to send quiz.");
  }
};

module.exports = { handlePoll, handlePollAnswer };
