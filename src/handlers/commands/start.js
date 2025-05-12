/**
 * Start command handler
 * Handles the /start command which is the entry point for new users
 * Creates a new user in the database and sends a welcome message
 */

const dbService = require("../../services/db.service");
const sessionService = require("../../services/session.service");

const handleStart = async (ctx) => {
  const { id: userId, username, first_name, last_name = "" } = ctx.from;
  try {
    // Create new user in database
    await dbService.createUser(userId, username, first_name, last_name);
    
    // Reset session and send welcome message
    sessionService.resetSession(userId);
    await ctx.reply(
      `👋 <b>Welcome, ${first_name}!</b>\n\nUse /help to see available commands.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("Error in /start:", err);
    ctx.reply("⚠️ <b>Failed to start.</b>\n\nPlease try again later.", {
      parse_mode: "HTML",
    });
  }
};

module.exports = handleStart; 