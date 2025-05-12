/**
 * Review command handler
 * Handles the /review command which shows the user's answers and results for a quiz
 */


const sessionService = require("../../services/session.service");
const { handleDisplayFolders } = require("../helpers");

const handleReview = async (ctx) => {
  const userId = ctx.from.id;
  
  // Set stage to review quiz
  sessionService.updateSession(userId, {
    stage: "review_quiz"
  });
  
  // Display available folders
  handleDisplayFolders(ctx, "📂 Select a folder to review quizzes:");
};

module.exports = handleReview; 