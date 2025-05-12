/**
 * Confirm Folder command handler
 * Handles the /confirm_folder command which finalizes folder creation
 * Creates the folder in the database with the provided name
 */

const dbService = require("../../services/db.service");
const sessionService = require("../../services/session.service");

const handleConfirmFolder = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  // Check if folder creation is in progress
  if (!session.stage || session.stage !== "confirm_folder") {
    return ctx.reply("❌ <b>No folder creation in progress.</b>", {
      parse_mode: "HTML",
    });
  }

  try {
    // Create folder in database
    const folder = await dbService.createFolder(
      userId,
      session.folderName
    );

    // Reset session and send success message
    sessionService.resetSession(userId);
    ctx.reply(
      `✅ Folder "<b>${folder.name}</b>" created successfully!\n\nUse /new_quiz to add a quiz to this folder.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("Error in confirming folder:", err);
    ctx.reply(
      "⚠️ <b>Failed to confirm folder.</b>\n\nPlease try again later.",
      { parse_mode: "HTML" }
    );
  }
};

module.exports = handleConfirmFolder; 