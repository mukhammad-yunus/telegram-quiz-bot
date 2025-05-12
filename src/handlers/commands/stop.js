/**
 * Stop command handler
 * Stops the current quiz and clears all saved data
 */

const sessionService = require('../../services/session.service');

const handleStop = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  // Check if user is in an active quiz
  if (!session || session.stage !== 'start_quiz') {
    return ctx.reply('❌ No active quiz to stop.');
  }

  // Clear all quiz data
  sessionService.resetSession(userId);

  await ctx.reply('✅ Quiz stopped successfully. All progress has been cleared.');
};

module.exports = handleStop; 