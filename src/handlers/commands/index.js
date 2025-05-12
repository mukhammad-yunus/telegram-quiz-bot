/**
 * Commands index file
 * Exports all command handlers for easy importing in the main bot file
 */

const handleStart = require("./start");
const handleNewQuiz = require("./newQuiz");
const handleQuizzes = require("./quizzes");
const handleAddFolder = require("./addFolder");
const handleConfirmFolder = require("./confirmFolder");
const handleSkip = require("./skip");
const handleUndo = require("./undo");
const handleDone = require("./done");
const handleReview = require("./review");
const handleHelp = require("./help");
const handleCancel = require("./cancel");
const handleStop = require("./stop");

module.exports = {
  handleStart,
  handleNewQuiz,
  handleQuizzes,
  handleAddFolder,
  handleConfirmFolder,
  handleSkip,
  handleUndo,
  handleDone,
  handleReview,
  handleHelp,
  handleCancel,
  handleStop
}; 