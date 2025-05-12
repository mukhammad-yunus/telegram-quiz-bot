/**
 * Helper functions for handling common bot operations
 */

const { Markup } = require("telegraf");
const dbService = require("../services/db.service");
const sessionService = require("../services/session.service");

/**
 * Display folders in an inline keyboard
 * @param {Object} ctx - Telegraf context
 * @param {string} message - Message to display with the folders
 */
const handleDisplayFolders = async (ctx, message = "📂 Select a folder:") => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  try {
    const folders = await dbService.listFolders(userId);
    if (!folders.length) {
      return ctx.reply(
        "📭 <b>No folders yet.</b>\n\nUse /add_folder to create one.",
        { parse_mode: "HTML" }
      );
    }
    
    const buttons = folders.map((folder) => [
      Markup.button.callback(folder.name, `select_folder_${folder.id}`),
    ]);

    await ctx.reply(message, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons),
    });
  } catch (err) {
    console.error("Error in displaying folders:", err);
    ctx.reply(
      "⚠️ <b>Failed to fetch folders.</b>\n\nPlease try again later.",
      { parse_mode: "HTML" }
    );
  }
};

/**
 * Display quizzes in an inline keyboard with pagination
 * @param {Object} ctx - Telegraf context
 * @param {boolean} isEdit - Whether to edit the existing message
 */
const handleDisplayQuizzes = async (ctx, isEdit = false) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  if (!session.quizzes || !session.quizzes.length) {
    return ctx.reply(
      "📭 <b>No quizzes in this folder yet.</b>\n\nUse /new_quiz to create one.",
      { parse_mode: "HTML" }
    );
  }

  const currentChunk = session.quizzes[session.currentChunkArrayIndex];
  const buttons = currentChunk.map((quiz, index) => [
    Markup.button.callback(quiz.title, `select_quiz_${index}`),
  ]);

  // Add navigation buttons if needed
  const navButtons = [];
  if (session.currentChunkArrayIndex > 0) {
    navButtons.push(Markup.button.callback("⬅️ Previous", "previous_quiz"));
  }
  if (session.currentChunkArrayIndex < session.quizzes.length - 1) {
    navButtons.push(Markup.button.callback("Next ➡️", "next_quiz"));
  }
  if (navButtons.length) {
    buttons.push(navButtons);
  }

  // Add back button
  buttons.push([Markup.button.callback("Back to folders", "back_to_folders")]);

  const message = `📚 <b>Quizzes in this folder:</b>\n\nSelect a quiz to view details:`;

  if (isEdit) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons),
    });
  } else {
    await ctx.reply(message, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons),
    });
  }
};

function makeChunkArray(array, chunkSize = 5) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

module.exports = {
  handleDisplayFolders,
  handleDisplayQuizzes,
  makeChunkArray,
};
