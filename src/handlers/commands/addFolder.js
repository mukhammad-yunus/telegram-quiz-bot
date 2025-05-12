/**
 * Add Folder command handler
 * Handles the /add_folder command which starts the folder creation process
 * Prompts user to enter a name for the new folder
 */

const sessionService = require("../../services/session.service");

const handleAddFolder = async (ctx) => {
  const userId = ctx.from.id;
  
  // Set stage to create folder
  sessionService.updateSession(userId, {
    stage: "create_folder"
  });
  
  // Prompt user for folder name
  ctx.reply("📁 Enter a name for your new folder (1–50 characters):");
};

module.exports = handleAddFolder; 