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
3. Create a `.env` file with the following configuration:
   ```
   # Telegram Bot Token
   BOT_TOKEN=your_bot_token_here

   # PostgreSQL Database Configuration
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   ```
4. Make sure PostgreSQL is installed and running on your system
5. Create a database with the name specified in DB_NAME
6. Start the bot:
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