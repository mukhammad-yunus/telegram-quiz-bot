# Telegram Quiz Bot

A Telegram bot that allows users to create, manage, and take quizzes. The bot supports multiple features including:

- Creating and managing quiz folders
- Creating quizzes with multiple-choice questions
- Setting timers for questions
- Reviewing quiz results
- Importing quizzes via JSON files

## Features

- 📂 Folder Management: Organize quizzes into folders
- 📝 Quiz Creation: Create quizzes with multiple-choice questions
- ⏱️ Timer Support: Set time limits for questions
- 📊 Results Review: Review your quiz performance
- 📤 JSON Import: Import quizzes using JSON files

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Telegram bot token:
   ```
   BOT_TOKEN=your_bot_token_here
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Usage

- `/start` - Start the bot
- `/new_quiz` - Create a new quiz
- `/list_quizzes` - List all quizzes
- `/review_quizzes` - Review your quiz results
- `/new_folder` - Create a new folder
- `/list_folders` - List all folders
- `/import_quiz` - Import a quiz from JSON

## License

MIT 