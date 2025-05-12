/**
 * Done command handler
 * Handles the /done command which finalizes quiz creation
 * Creates the quiz in the database with all provided information
 */

const { Markup } = require("telegraf");
const dbService = require("../../services/db.service");
const sessionService = require("../../services/session.service");

const handleDone = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  // Validate quiz creation state
  if (!session.stage || !session.quizTitle) {
    return ctx.reply("❌ *No quiz creation in progress\\.*", {
      parse_mode: "MarkdownV2",
    });
  }

  // Check if quiz has questions
  if (session.quizTitle && (!session.quiz || session.quiz.length === 0)) {
    return ctx.reply(
      "⚠️ *You have an unfinished quiz\\.*\n\nPlease finish creating your quiz or send `/cancel`\\.",
      { parse_mode: "MarkdownV2" }
    );
  }

  if (
    session.stage === "awaiting_quiz_poll" &&
    session.quizTitle &&
    session.folderId &&
    session.quiz.length > 0
  ) {
    sessionService.updateSession(userId, {
      stage: "done"
    });
    
    ctx.reply(
      `Please set a time limit for questions.\n\nIn groups, the bot will send the next question as soon as this time is up. We recommend using longer timers only if your quiz involves complex problems (like math, etc.). For most trivia-like quizzes, 10–30 seconds are more than enough.`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("15 sec", "set_timer_15"),
          Markup.button.callback("30 sec", "set_timer_30"),
        ],
        [
          Markup.button.callback("1 min", "set_timer_60"),
          Markup.button.callback("1 min 30 sec", "set_timer_90"),
        ],
        [Markup.button.callback("2 min", "set_timer_120")],
      ]),
      { parse_mode: "HTML" }
    );
  }
};

module.exports = handleDone; 