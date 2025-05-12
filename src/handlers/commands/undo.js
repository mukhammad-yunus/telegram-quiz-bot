/**
 * Undo command handler
 * Handles the /undo command which allows users to undo their last action
 * Can undo quiz title, description, or remove the last question
 */

const handleUndo = async (ctx) => {
  // Check if there's anything to undo
  if (!ctx.session || !ctx.session.stage) {
    return ctx.reply("❌ <b>There is nothing to undo.</b>", {
      parse_mode: "HTML",
    });
  }

  // Handle undo based on current stage
  if (ctx.session.stage === "awaiting_quiz_description") {
    // Undo description and go back to title
    ctx.session.quizDescription = null;
    ctx.session.stage = "awaiting_quiz_title";
    return ctx.reply(
      "Let's create a new quiz. First, send me the title of your quiz (e.g., 'Aptitude Test' or '10 questions about bears')."
    );
  }

  if (ctx.session.stage === "awaiting_quiz_title") {
    // Discard entire quiz
    ctx.session = {};
    ctx.reply("Quiz discarded. Send /new_quiz to create a new one.");
  }

  if (ctx.session.stage === "awaiting_quiz_poll") {
    if (ctx.session.quiz.length === 0) {
      // Go back to description if no questions yet
      ctx.reply(
        "Now send me a description of your quiz. This is optional, you can /skip this step."
      );
      ctx.session.stage = "awaiting_quiz_description";
      return;
    }

    // Remove last question
    ctx.session.quiz.pop();
    const numOfQuestions = ctx.session.quiz.length;
    ctx.session.stage = "awaiting_quiz_poll";

    if (numOfQuestions === 0) {
      // If no questions left, prompt for first question
      ctx.reply(
        "Now send me a poll with your first question.\n\n<b>Warning:</b> This bot can't create anonymous polls. Users in groups will see votes from other members.",
        { parse_mode: "HTML" }
      );
      ctx.session.quiz = [];
      return;
    }

    // Show remaining questions count
    ctx.reply(
      `Your quiz now has <b>${numOfQuestions}</b> question${
        numOfQuestions > 1 ? "s" : ""
      }. If you made a mistake in the question, you can go back by sending /undo.\n\nNow send the next question – or some text or media that will be shown before it.\n\nWhen done, simply send /done to finish creating the quiz.`
    );
  }
};

module.exports = handleUndo; 