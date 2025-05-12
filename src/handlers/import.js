const { Markup } = require("telegraf");
const dbService = require("../services/db.service");
const sessionService = require("../services/session.service");

function validateQuizJson(jsonData) {
  const validQuestions = [];
  const errorMessages = [];

  // Validate title
  if (!jsonData.title || typeof jsonData.title !== "string" || jsonData.title.length > 100) {
    errorMessages.push(
      "Invalid or missing 'title'. It must be a string with a maximum length of 100 characters."
    );
  }

  // Validate description (optional)
  if (jsonData.description && typeof jsonData.description !== "string") {
    errorMessages.push("Invalid 'description'. It must be a string.");
  }

  // Validate timer
  if (jsonData.timerSeconds !== undefined) {
    if (
      typeof jsonData.timerSeconds !== "number" ||
      jsonData.timerSeconds <= 0 ||
      jsonData.timerSeconds > 3600
    ) {
      errorMessages.push(
        "Invalid 'timerSeconds'. It must be a positive number not exceeding 3600 seconds."
      );
    }
  }

  // Validate questions array
  if (!Array.isArray(jsonData.questions) || jsonData.questions.length === 0) {
    errorMessages.push(
      "Invalid or missing 'questions'. It must be a non-empty array."
    );
  } else {
    jsonData.questions.forEach((question, index) => {
      const questionErrors = [];
      
      // Validate question text
      if (!question.text || typeof question.text !== "string") {
        questionErrors.push("missing or invalid 'text' field");
      } else if (question.text.length > 300) {
        questionErrors.push("question text exceeds 300 characters");
      }

      // Validate options
      if (!Array.isArray(question.options)) {
        questionErrors.push("missing or invalid 'options' array");
      } else {
        if (question.options.length < 2 || question.options.length > 10) {
          questionErrors.push("must have between 2 and 10 options");
        }
        
        // Validate each option
        question.options.forEach((option, optIndex) => {
          if (typeof option !== "string") {
            questionErrors.push(`option ${optIndex + 1} is not a string`);
          } else if (option.length > 100) {
            questionErrors.push(`option ${optIndex + 1} exceeds 100 characters`);
          }
        });
      }

      // Validate correct option
      if (
        typeof question.correctOption !== "number" ||
        question.correctOption < 0 ||
        question.correctOption >= question.options.length
      ) {
        questionErrors.push("invalid 'correctOption' index");
      }

      // Validate explanation (optional)
      if (question.explanation !== undefined) {
        if (typeof question.explanation !== "string") {
          questionErrors.push("explanation must be a string");
        } else if (question.explanation.length > 200) {
          questionErrors.push("explanation exceeds 200 characters");
        }
      }

      // If no errors, add to valid questions
      if (questionErrors.length === 0) {
        validQuestions.push(question);
      } else {
        // Include the question text in the error message
        const questionText = question.text ? `"${question.text.substring(0, 50)}${question.text.length > 50 ? '...' : ''}"` : 'No text provided';
        errorMessages.push(`Question ${index + 1} (${questionText}):\n  - ${questionErrors.join("\n  - ")}`);
      }
    });
  }

  return {
    validQuestions,
    errorMessages
  };
}

/**
 * Import a quiz from a JSON file and save it to the database.
 * @param {Object} jsonData - The JSON data sent by the user.
 * @param {number} userId - The Telegram user ID of the user importing the quiz.
 * @param {number} folderId - The folder ID where the quiz will be saved.
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function importQuizFromJson(jsonData, userId, folderId) {
  const { validQuestions, errorMessages } = validateQuizJson(jsonData);

  if (validQuestions.length === 0) {
    return {
      success: false,
      message: `No valid questions found. Validation errors:\n\n${errorMessages.join("\n\n")}`,
    };
  }

  try {
    // Create the quiz in the database
    const quiz = await dbService.createQuiz(
      userId,
      folderId,
      jsonData.title,
      jsonData.description || "",
      jsonData.timerSeconds || 30, // Default timer is 30 seconds
      true, // Shuffle questions
      true // Shared quiz
    );

    // Add only valid questions to the quiz
    for (const question of validQuestions) {
      await dbService.addQuestion(
        quiz.id,
        question.text,
        question.options,
        question.correctOption,
        question.explanation || null
      );
    }

    const message = `Quiz "${jsonData.title}" imported successfully with ${validQuestions.length} question${
      validQuestions.length > 1 ? "s" : ""
    }.`;

    // Add validation errors to the message if any
    if (errorMessages.length > 0) {
      return {
        success: true,
        message: `${message}\n\nSkipped questions:\n\n${errorMessages.join("\n\n")}`,
      };
    }

    return {
      success: true,
      message,
    };
  } catch (err) {
    console.error("Error importing quiz:", err);
    return {
      success: false,
      message: "Failed to import quiz. Please try again later.",
    };
  }
}

const sampleQuizJson = {
  title: "General Knowledge Quiz",
  description: "A quiz to test your general knowledge.",
  timerSeconds: 30,
  questions: [
    {
      text: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      correctOption: 0,
      explanation: "Paris is the capital of France.",
    },
    {
      text: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      correctOption: 1,
      explanation: "Mars is known as the Red Planet.",
    },
  ],
};

/**
 * Handle the import command logic.
 * @param {Object} ctx - The Telegram context object.
 */
async function handleImportCommand(ctx) {
  const userId = ctx.from.id;
  sessionService.updateSession(userId, {
    stage: "select_folder_for_import"
  });

  // Display folders for selection
  const folders = await dbService.listFolders(userId);
  if (!folders.length) {
    sessionService.resetSession(userId);
    return ctx.reply("📭 No folders yet. Use /add_folder to create one.");
  }

  const buttons = folders.map((folder) => [
    Markup.button.callback(folder.name, `f_i_${folder.id}`),
  ]);
  
  ctx.reply(
    "📂 Select a folder where you want to import the quiz:",
    Markup.inlineKeyboard(buttons)
  );
}

/**
 * Handle the JSON file sent by the user.
 * @param {Object} ctx - The Telegram context object.
 */
async function handleJsonFile(ctx) {
  const userId = ctx.from.id;
  const session = sessionService.getSession(userId);

  if (!session.stage || session.stage !== "awaiting_json_file") {
    ctx.deleteMessage();
    return ctx.reply('❌ Import process stopped. Use /import to start again.');
  }

  const fileId = ctx.message.document.file_id;

  try {
    session.stage = "working_on_json_file";
    // Get the file URL from Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // Fetch the JSON file
    const response = await fetch(fileLink.href);
    const jsonResponse = await response.json();
    const jsonData = JSON.parse(JSON.stringify(jsonResponse));

    // Import the quiz
    const folderId = session.folderId; // Ensure folderId is set in the session
    const result = await importQuizFromJson(jsonData, userId, folderId);

    sessionService.resetSession(userId);
    ctx.reply(result.message);
  } catch (err) {
    console.error("Error handling JSON file:", err);
    ctx.reply(
      "⚠️ Failed to process the JSON file. Please ensure it is a valid JSON quiz file."
    );
  }
}

module.exports = {
  validateQuizJson,
  importQuizFromJson,
  sampleQuizJson,
  handleImportCommand,
  handleJsonFile,
};
