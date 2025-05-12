# Telegram Quiz Bot

A powerful Telegram bot for creating, managing, and taking quizzes. This bot allows users to create quizzes with multiple-choice questions, set timers, and review their answers.

## Features

- 📁 **Folder Management**: Organize quizzes into folders
- ✍️ **Quiz Creation**: Create quizzes with multiple-choice questions
- ⏱️ **Timer Support**: Set custom timers for each question
- 📊 **Quiz Taking**: Take quizzes with interactive polls
- 📝 **Answer Review**: Review your answers after completing a quiz
- 📤 **Import/Export**: Import quizzes from JSON files
- 🔄 **Shuffle Questions**: Randomize question order
- 👥 **Shared Quizzes**: Share quizzes with other users

## Setup

1. Clone the repository:
```bash
git clone https://github.com/mukhammad-yunus/telegram-quiz-bot.git
cd telegram-quiz-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=your_database_url
```

4. Start the bot:
```bash
npm start
```

## Commands

- `/start` - Start the bot
- `/new_quiz` - Create a new quiz
- `/list_quizzes` - List all quizzes
- `/review` - Review your quiz answers
- `/import` - Import a quiz from JSON
- `/help` - Show help message

## Quiz JSON Format

Example quiz JSON format:
```json
{
  "title": "Sample Quiz",
  "description": "A sample quiz with multiple-choice questions",
  "timerSeconds": 30,
  "questions": [
    {
      "text": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correctOption": 1,
      "explanation": "Paris is the capital of France."
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Mukhammad Yunus - [GitHub](https://github.com/mukhammad-yunus) 