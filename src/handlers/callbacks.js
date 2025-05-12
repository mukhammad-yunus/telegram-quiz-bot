/**
 * Callback query handler
 * Handles all callback queries from inline keyboards
 */

const { Markup } = require("telegraf");
const dbService = require("../services/db.service");
const sessionService = require("../services/session.service");
const {
  handleDisplayFolders,
  handleDisplayQuizzes,
  makeChunkArray,
} = require("./helpers");
const { sampleQuizJson } = require("./import");

const handleCallback = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  if (!session.stage) {
    await ctx.editMessageText("❌ Session expired. Please start again.");
    return;
  }

  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery(); // Acknowledge the query immediately

  if (data.startsWith("select_folder_")) {
    const folderId = parseInt(data.replace("select_folder_", ""));

    if (session.stage === "list_quizzes") {
      const quizzes = await dbService.listQuizzes(folderId, userId);
      if (!quizzes.length) {
        return await ctx.editMessageText(
          "📭 No quizzes in this folder yet.\n\n Use /new_quiz to create a quiz!",
          Markup.inlineKeyboard([
            Markup.button.callback("Back to folders", "back_to_folders"),
          ])
        );
      }

      sessionService.updateSession(userId, {
        quizzes: makeChunkArray(quizzes, 5),
        currentChunkArrayIndex: 0
      });

      handleDisplayQuizzes(ctx, true);
      return;
    }

    if (session.stage === "review_quiz") {
      // Get quizzes in this folder that the user has responses for
      const quizzes = await dbService.listQuizzes(folderId, userId);
      // Filter quizzes to only those the user has responses for
      const quizIdsWithResponses = (await dbService.getQuizIdsWithResponses(userId, folderId));
      const filteredQuizzes = quizzes.filter(q => quizIdsWithResponses.includes(q.id));
      if (!filteredQuizzes.length) {
        return await ctx.editMessageText(
          "📭 No solved quizzes in this folder yet.\n\nTry another folder!"
        );
      }
      sessionService.updateSession(userId, {
        quizzes: filteredQuizzes,
        stage: "review_select_quiz"
      });
      // Show quizzes to select
      const buttons = filteredQuizzes.map((quiz, idx) => [
        Markup.button.callback(quiz.title, `review_select_quiz_${quiz.id}`)
      ]);
      return ctx.editMessageText(
        "📝 Select a quiz to review your answers:",
        Markup.inlineKeyboard(buttons)
      );
    }

    sessionService.updateSession(userId, {
      folderId,
      stage: "awaiting_quiz_title",
      quizTitle: ""
    });

    ctx.editMessageText(
      "📝 Let's create a new quiz. First, send me the title of your quiz (e.g., 'Aptitude Test' or '10 questions about bears')."
    );
  }

  if (data.startsWith("f_i_")) {
    const folderId = parseInt(data.replace("f_i_", ""));
    sessionService.updateSession(userId, {
      folderId,
      stage: "awaiting_json_file"
    });

    ctx.editMessageText(
      `📂 *Please send me a JSON file with the quiz data\\.*\n\nThe file should contain the quiz title, description, timer, and questions\\. Here is an example:\n\n\`\`\`json\n${JSON.stringify(
        sampleQuizJson,
        null,
        2
      )}\n\`\`\``,
      { 
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback("❌ Cancel", "cancel_import")]
          ]
        }
      }
    );
  }

  if (data.startsWith("select_quiz_")) {
    const quizIndex = parseInt(data.replace("select_quiz_", ""));
    const currentQuiz = session.quizzes[session.currentChunkArrayIndex][quizIndex];
    const quizId = currentQuiz.id;

    sessionService.updateSession(userId, {
      currentQuiz,
      stage: "view_quiz"
    });

    const questions = await dbService.getQuizById(quizId);
    sessionService.updateSession(userId, { questions });

    const numberOfQuestions = questions.length;
    const quizDetails = `<b>Quiz Title</b>: ${currentQuiz.title}\n<b>Description</b>: ${
      currentQuiz.description || "No description"
    }\n\n<b>Questions</b>:\n${numberOfQuestions} ${
      numberOfQuestions > 1
        ? "questions"
        : numberOfQuestions === 0
        ? "<b>No question</b>"
        : "question"
    }`;

    await ctx.editMessageText(quizDetails, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback("Start Quiz", `start_quiz`)],
          [Markup.button.callback("Delete Quiz", `delete_quiz`)],
          [Markup.button.callback("Back to folders", "back_to_folders")],
        ],
      },
    });
  }

  if (data === "back_to_folders") {
    if (!session.stage) {
      await ctx.editMessageText("❌ Session expired. Please start again.");
      return;
    }

    sessionService.updateSession(userId, { stage: "back_to_folders" });
    handleDisplayFolders(ctx, "📂 Select a folder to view quizzes:");
  }

  if (data.startsWith("set_timer_")) {
    const timerSeconds = parseInt(data.replace("set_timer_", ""));
    sessionService.updateSession(userId, { timerSeconds });

    const quiz = await dbService.createQuiz(
      userId,
      session.folderId,
      session.quizTitle,
      session.quizDescription,
      timerSeconds,
      true,
      true
    );

    try {
      let questionCount = 0;
      for (const question of session.quiz) {
        await dbService.addQuestion(
          quiz.id,
          question.question,
          question.options,
          question.correctOption,
          question.explanation || null
        );
        questionCount++;
        await ctx.editMessageText(
          `✅ Successfully added question ${questionCount} of ${session.quiz.length} to the quiz.`
        );
      }

      sessionService.resetSession(userId);
      await ctx.reply(
        `🎉 Quiz "${quiz.title}" created successfully with ${questionCount} question${
          questionCount > 1 ? "s" : ""
        }!`
      );
    } catch (err) {
      console.error("Error adding questions to quiz:", err);
      await ctx.reply(
        "⚠️ Failed to add questions to quiz. Please try again later."
      );
    }
  }

  if (data === "next_quiz") {
    if (!session.quizzes) return;
    sessionService.updateSession(userId, {
      currentChunkArrayIndex: session.currentChunkArrayIndex + 1
    });
    handleDisplayQuizzes(ctx, true);
  }

  if (data === "previous_quiz") {
    if (session.currentChunkArrayIndex <= 0) {
      sessionService.updateSession(userId, { currentChunkArrayIndex: 0 });
      return;
    }

    sessionService.updateSession(userId, {
      currentChunkArrayIndex: session.currentChunkArrayIndex - 1
    });
    handleDisplayQuizzes(ctx, true);
  }

  if (data === "delete_quiz") {
    const quizId = session.currentQuiz.id;
    await dbService.deleteQuiz(quizId, userId);
    sessionService.resetSession(userId);
    await ctx.editMessageText("✅ Quiz deleted successfully.");
  }

  if (data === "start_quiz") {
    if (!session || !session.currentQuiz) {
      await ctx.editMessageText("❌ Session expired. Please start again.");
      return;
    }

    sessionService.updateSession(userId, {
      stage: "start_quiz",
      currentQuestionIndex: 0
    });

    const currentQuiz = session.currentQuiz;
    const mins = Math.floor(currentQuiz.timer_seconds / 60);
    const secs = currentQuiz.timer_seconds % 60;
    const timerMessage =
      mins <= 0
        ? `⏱ ${secs} seconds`
        : `⏱ ${mins} minute${mins > 1 ? "s" : ""} ${
            secs >= 0 ? `${secs} seconds` : ""
          }`;
    const questions = session.questions;
    const numberOfQuestions = questions.length;

    // Build the message
    const quizMessage = `🎲 Get ready for the quiz <b>'${currentQuiz.title}'</b>

🖊 ${numberOfQuestions} ${numberOfQuestions === 1 ? "question" : "questions"}
${timerMessage} per question
📰 Votes are visible to the quiz owner

🏁 Press the button below when you are ready.
Send /stop to stop it.`;

    // Send the message with HTML formatting
    await ctx.reply(quizMessage, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        Markup.button.callback("I am ready!", "i_am_ready"),
      ]),
    });
  }

  if (data === "i_am_ready") {
    if (!session || !session.currentQuiz) {
      await ctx.editMessageText("❌ Session expired. Please start again.");
      return;
    }
    await ctx.editMessageReplyMarkup();

    // Store the chat ID
    sessionService.setChatId(userId, ctx.chat.id);

    // Countdown messages
    const countdownMessages = [
      "3️⃣...",
      "2️⃣ READY...",
      "1️⃣ SET...",
      "🚀 GOOOO!",
    ];
    let sentMessage;

    for (let i = 0; i < countdownMessages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, i === 0 ? 0 : 1000));
      if (i === 0) {
        sentMessage = await ctx.reply(countdownMessages[i]);
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          sentMessage.message_id,
          null,
          countdownMessages[i]
        );
      }
    }

    // Send the quiz question
    const questionNumber = sessionService.getCurrentQuestionNumber(ctx.from.id);
    const questionData = session.questions[session.currentQuestionIndex];
    const questionText = `${questionNumber} ${questionData.question}`;
    const options = questionData.options;
    const correctOptionId = questionData.correct_option;
    try {
      // If question is too long, send it as a separate message first
      if (questionData.question.length >= 300) {
        await ctx.telegram.sendMessage(
          ctx.chat.id,
          `<b>${questionNumber}</b> ${questionData.question}`,
          { parse_mode: "HTML" }
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Send the poll with modified question text if needed
      await ctx.telegram.sendPoll(
        ctx.chat.id,
        questionData.question.length >= 300
          ? `${questionNumber} Question provided above`
          : questionText,
        options,
        {
          type: "quiz", 
          correct_option_id: correctOptionId,
          is_anonymous: false,
          explanation: questionData.explanation && questionData.explanation.length < 200
            ? questionData.explanation
            : undefined,
          open_period: session.currentQuiz.timer_seconds || 60,
        }
      );
    } catch (err) {
      console.error("Failed to send quiz question:", err);
      await ctx.reply("⚠️ Failed to send quiz.");
    } finally {
      await ctx.telegram.deleteMessage(ctx.chat.id, sentMessage.message_id);
    }
  }

  if (data.startsWith("review_select_quiz_") && session.stage === "review_select_quiz") {
    const quizId = parseInt(data.replace("review_select_quiz_", ""));
    // Get all questions for this quiz
    const questions = await dbService.getQuestionsByQuiz(quizId);
    // Get all responses for this quiz by the user
    const responses = await dbService.getResponsesForQuiz(userId, quizId);
    if (!responses.length) {
      return ctx.editMessageText("❌ No responses found for this quiz.");
    }

    // Send a header message
    await ctx.editMessageText("<b>Quiz Review</b>\n\nReviewing your answers...", { parse_mode: "HTML" });

    // Helper function to escape special characters
    const escapeHtml = (text) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`/g, "&#96;")
        .replace(/\*/g, "&#42;")
        .replace(/_/g, "&#95;")
        .replace(/\[/g, "&#91;")
        .replace(/\]/g, "&#93;")
        .replace(/\(/g, "&#40;")
        .replace(/\)/g, "&#41;");
    };

    // Send each question and answer separately
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const resp = responses.find(r => r.question_id === q.id);
      if (!resp) continue;

      const questionMsg = `<b>Q${i+1}</b>: ${escapeHtml(q.question)}\n` +
        `<b>Your answer</b>: ${escapeHtml(q.options[resp.selected_index])}\n` +
        `<b>Result</b>: ${resp.is_correct ? '✅ Correct' : '❌ Wrong'}\n` +
        (q.explanation ? `<b>Explanation</b>: ${escapeHtml(q.explanation)}\n` : '');

      // Add a small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      await ctx.reply(questionMsg, { parse_mode: "HTML" });
    }

    // Send a summary message
    const correctAnswers = responses.filter(r => r.is_correct).length;
    const totalQuestions = responses.length;
    await ctx.reply(
      `<b>Quiz Summary</b>\n\n` +
      `Total Questions: ${totalQuestions}\n` +
      `Correct Answers: ${correctAnswers}\n` +
      `Score: ${correctAnswers}/${totalQuestions}`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Handle import cancellation
  if (data === "cancel_import" && session.stage == "awaiting_json_file") {
    sessionService.resetSession(userId);
    await ctx.editMessageText("✅ Import process cancelled successfully.");
    return;
  }

  if (data.startsWith("delete_folder_")) {
    const folderId = parseInt(data.replace("delete_folder_", ""));
    try {
      await dbService.deleteFolder(folderId, userId);
      sessionService.resetSession(userId);
      await ctx.editMessageText("✅ Folder deleted successfully!");
    } catch (err) {
      console.error("Error deleting folder:", err);
      await ctx.editMessageText("⚠️ Failed to delete folder. Please try again later.");
    }
  }
};

module.exports = {
  handleCallback,
};
 