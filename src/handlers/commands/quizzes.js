/**
 * Quizzes command handler
 * Handles the /quizzes command which displays all quizzes in a folder
 * Shows available folders for the user to select which folder to view
 */

const { handleDisplayFolders } = require("../helpers");
const sessionService = require("../../services/session.service");

const handleQuizzes = async (ctx) => {
  const userId = ctx.from.id;
  
  // Set stage to list quizzes
  sessionService.updateSession(userId, {
    stage: "list_quizzes"
  });
  
  // Display available folders
  handleDisplayFolders(ctx, "📂 Select a folder to view quizzes:");
};

module.exports = handleQuizzes; 