/**
 * Help command handler
 * Displays a comprehensive help menu with all available commands and features
 */

const handleHelp = async (ctx) => {
  ctx.reply(
    `ℹ️ <b>Help Menu</b>\n\nHere are the available commands:\n
/start - Start the bot and register yourself
/help - Show this help menu
/add_folder - Create a new folder to organize your quizzes
/delete_folder - Delete an existing folder
/new_quiz - Start creating a new quiz by selecting a folder
/quizzes - View quizzes in a selected folder
/import - Import a quiz from a JSON file
/review - Review your answers and results for completed quizzes
/confirm_folder - Confirm the creation of a folder after naming it
/skip - Skip optional steps like adding a quiz description
/undo - Undo the last step in quiz creation
/done - Finish creating a quiz and set a timer for questions
/cancel - Cancel the current quiz creation process
/stop - Stop an ongoing quiz\n
📂 <b>Folder Management</b>\n
• Create folders to organize your quizzes
• Each folder can contain multiple quizzes
• Folders are private to your account\n
📝 <b>Quiz Creation</b>\n
1. Use /new_quiz or /import
2. Select a folder
3. For /new_quiz:
   • Provide a title
   • Optionally add a description
   • Add questions using non-anonymous polls
   • Use /done to finish
   • Use /cancel to abort at any time
4. For /import:
   • Send a JSON file with quiz data
   • Include title, description, timer, and questions\n
🎯 <b>Taking Quizzes</b>\n
• Select a quiz from your folders
• Each question has a timer
• Get immediate feedback on answers
• Review your results later with /review
• Use /stop to end the quiz early\n
⚠️ <b>Important Notes</b>\n
• All polls must be non-anonymous
• Quiz timers are per question
• You can review your answers anytime
• Imported quizzes must follow the correct JSON format
• Use /cancel to abort quiz creation
• Use /stop to end an ongoing quiz`,
    { parse_mode: "HTML" }
  );
};

module.exports = handleHelp; 