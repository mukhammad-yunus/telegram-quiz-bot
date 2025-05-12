require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const dbService = require("./services/db.service");
const { message } = require("telegraf/filters");
const sessionService = require("./services/session.service");
const {
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
  handleStop,
} = require("./handlers/commands");
const { handleText } = require("./handlers/text");
const { handleCallback } = require("./handlers/callbacks");
const { handleImportCommand, handleJsonFile, sampleQuizJson } = require("./handlers/import");
const { handlePoll, handlePollAnswer } = require("./handlers/poll");
const handleDeleteFolder = require("./handlers/commands/deleteFolder");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Command handlers
bot.start(handleStart);
bot.command("new_quiz", handleNewQuiz);
bot.command("quizzes", handleQuizzes);
bot.command("add_folder", handleAddFolder);
bot.command("confirm_folder", handleConfirmFolder);
bot.command("skip", handleSkip);
bot.command("undo", handleUndo);
bot.command("done", handleDone);
bot.command("import", handleImportCommand);
bot.command("review", handleReview);
bot.command("help", handleHelp);
bot.command("cancel", handleCancel);
bot.command("stop", handleStop);
bot.command("delete_folder", handleDeleteFolder);

// Message handlers
bot.on(message("text"), handleText);
bot.on(message("document"), handleJsonFile);

// Callback query handler
bot.on("callback_query", handleCallback);

// Replace poll and poll_answer listeners
bot.on("poll", handlePoll);
bot.on("poll_answer", handlePollAnswer);

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply("⚠️ <b>An error occurred.</b>\n\nPlease try again later.", {
      parse_mode: "HTML",
    });
});

// Start the bot
bot.launch({
  allowedUpdates: ["poll_answer", "message", "callback_query"],
}).then(() => {
  console.log("Bot started successfully!");
}).catch((err) => {
  console.error("Failed to start bot:", err);
  });

// Enable graceful stop
// process.once("SIGINT", () => bot.stop("SIGINT"));
// process.once("SIGTERM", () => bot.stop("SIGTERM"));
// Add this to your main bot file
process.on('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});