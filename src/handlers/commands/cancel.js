/**
 * Cancel command handler
 * Cancels the current quiz creation process and clears all saved data
 */

const sessionService = require('../../services/session.service');

const handleCancel = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  // Check if user is in quiz creation process
  if (!session || !['awaiting_quiz_title', 'awaiting_quiz_description', 'awaiting_quiz_poll'].includes(session.stage)) {
    return ctx.reply('❌ No quiz creation process to cancel.');
  }

  // Clear all quiz creation data
  sessionService.resetSession(userId);

  await ctx.reply('✅ Quiz creation cancelled successfully. All data has been cleared.');
};

module.exports = handleCancel; 