/**
 * New Quiz command handler
 * Handles the /new_quiz command which starts the quiz creation process
 * Shows available folders for the user to select where to create the quiz
 */

const { handleDisplayFolders } = require("../helpers");
const sessionService = require("../../services/session.service");

const handleNewQuiz = (ctx) => {
  const userId = ctx.from.id;
  
  // Set stage to select folder for new quiz
  sessionService.updateSession(userId, {
    stage: "select_folder_for_quiz"
  });
  
  // Display available folders
  handleDisplayFolders(ctx, "📂Select a folder to create a new quiz:");
};

module.exports = handleNewQuiz; 