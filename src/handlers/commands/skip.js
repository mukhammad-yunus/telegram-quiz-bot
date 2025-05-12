/**
 * Skip command handler
 * Handles the /skip command which allows users to skip optional steps
 * Currently used to skip quiz description
 */

const sessionService = require("../../services/session.service");

const handleSkip = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  // Check if we're in the description stage
  if (!session.stage || session.stage !== "awaiting_quiz_description") {
    return ctx.reply("❌ No quiz description in progress.");
  }

  // Skip description and move to poll stage
  sessionService.updateSession(userId, {
    quizDescription: null,
    quiz: session.quiz || [],
    stage: "awaiting_quiz_poll"
  });

  // Prompt user to send first question
  ctx.reply(
    "Now send me a poll with your first question.\n\n<b>Warning:</b> This bot can't create anonymous polls. Users in groups will see votes from other members.",
    { parse_mode: "HTML" }
  );
};

module.exports = handleSkip; 