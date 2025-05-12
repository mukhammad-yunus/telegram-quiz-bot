const dbService = require("../services/db.service");
const sessionService = require("../services/session.service");

const handleText = async (ctx) => {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  if (!session.stage) {
    return;
  }

  if (session.stage === "create_folder") {
    const folderName = ctx.message.text.trim();
    if (folderName.length < 1 || folderName.length > 50) {
      return ctx.reply(
        "❌ <b>Invalid folder name.</b>\n\nPlease enter a name between 1 and 50 characters.",
        { parse_mode: "HTML" }
      );
    }
    sessionService.updateSession(userId, {
      folderName,
      stage: "confirm_folder"
    });
    return ctx.reply(
      `📁 You entered: <b>${folderName}</b>\n\nSend /confirm_folder to create this folder.`,
      { parse_mode: "HTML" }
    );
  }

  if (session.stage === "awaiting_quiz_title") {
    const title = ctx.message.text.trim();
    if (title.length < 1 || title.length > 100) {
      return ctx.reply(
        "❌ <b>Invalid title.</b>\n\nPlease enter a title between 1 and 100 characters.",
        { parse_mode: "HTML" }
      );
    }
    sessionService.updateSession(userId, {
      quizTitle: title,
      stage: "awaiting_quiz_description"
    });
    return ctx.reply(
      "Now send me a description of your quiz. This is optional, you can /skip this step."
    );
  }

  if (session.stage === "awaiting_quiz_description") {
    const description = ctx.message.text.trim();
    if (description.length > 1000) {
      return ctx.reply(
        "❌ <b>Description too long.</b>\n\nPlease enter a description under 1000 characters.",
        { parse_mode: "HTML" }
      );
    }
    sessionService.updateSession(userId, {
      quizDescription: description,
      quiz: session.quiz || [],
      stage: "awaiting_quiz_poll"
    });
    return ctx.reply(
      "Now send me a poll with your first question.\n\n<b>Warning:</b> This bot can't create anonymous polls. Users in groups will see votes from other members.",
      { parse_mode: "HTML" }
    );
  }
};

module.exports = {
  handleText,
}; 