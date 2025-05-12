/**
 * Delete Folder command handler
 * Handles the /delete_folder command which allows users to delete folders
 * Shows a list of folders with delete buttons
 */

const { handleDisplayFolders } = require("../helpers");
const sessionService = require("../../services/session.service");
const dbService = require("../../services/db.service");
const { Markup } = require("telegraf");

const handleDeleteFolder = async (ctx) => {
  const userId = ctx.from.id;
  
  // Set stage to delete folder
  sessionService.updateSession(userId, {
    stage: "delete_folder"
  });
  
  // Display available folders with delete buttons
  const folders = await dbService.listFolders(userId);
  if (!folders.length) {
    sessionService.resetSession(userId);
    return ctx.reply("📭 No folders to delete. Use /add_folder to create one.");
  }

  const buttons = folders.map((folder) => [
    Markup.button.callback(`🗑️ ${folder.name}`, `delete_folder_${folder.id}`),
  ]);

  await ctx.reply("<b>Select a folder to delete:</b>", {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons),
  });
};

module.exports = handleDeleteFolder; 