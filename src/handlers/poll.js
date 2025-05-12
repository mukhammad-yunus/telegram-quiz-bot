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
  const questionNumber = sessionService.getCurrentQuestionNumber(userId);
  const nextQuestion = session.questions[session.currentQuestionIndex];

  try {
    // Delay sending the next question by 0.5 seconds
    await new Promise(resolve => setTimeout(resolve, 1000));

    // If question is too long, send it as a separate message first
    if (nextQuestion.question.length >= 300) {
      await ctx.telegram.sendMessage(
        session.chatId,
        nextQuestion.question
      );
    }

    // Send the poll with modified question text if needed
    await ctx.telegram.sendPoll(
      session.chatId,
      nextQuestion.question.length >= 300 
        ? `${questionNumber} Question provided above`
        : `${questionNumber} ${nextQuestion.question}`,
      nextQuestion.options,
      {
        type: "quiz",
        correct_option_id: nextQuestion.correct_option,
        is_anonymous: false,
        explanation: nextQuestion.explanation && nextQuestion.explanation.length < 200 
          ? nextQuestion.explanation 
          : undefined,
        open_period: session.currentQuiz.timer_seconds || 60,
      }
    );
  } catch (err) {
    console.error("Failed to send next question:", err);
    await ctx.telegram.sendMessage(
      session.chatId,
      "⚠️ Failed to send next question."
    );
  }
};

module.exports = { handlePoll, handlePollAnswer };
