const db = require('../config/database');

const dbService = {
    // === USERS ===
    async createUser(userId, username, firstName, lastName) {
        const result = await db.query(
            `INSERT INTO users (user_id, username, first_name, last_name)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE
             SET username = $2, first_name = $3, last_name = $4
             RETURNING *`,
            [userId, username, firstName, lastName]
        );
        return result.rows[0];
    },

    // === FOLDERS ===
    async createFolder(userId, name) {
        const result = await db.query(
            `INSERT INTO folders (user_id, name)
             VALUES ($1, $2)
             ON CONFLICT (user_id, name) DO NOTHING
             RETURNING *`,
            [userId, name]
        );
        return result.rows[0];
    },

    async listFolders(userId) {
        const result = await db.query(
            `SELECT * FROM folders
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    async deleteFolder(folderId, userId) {
        await db.query(
            `DELETE FROM folders
             WHERE id = $1 AND user_id = $2`,
            [folderId, userId]
        );
    },

    // === QUIZZES ===
    async createQuiz(userId, folderId, title, description, timerSeconds, shuffle, isShared) {
        const result = await db.query(
            `INSERT INTO quizzes (user_id, folder_id, title, description, timer_seconds, shuffle, is_shared)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [userId, folderId, title, description, timerSeconds, shuffle, isShared]
        );
        return result.rows[0];
    },

    async listQuizzes(folderId, userId) {
        const result = await db.query(
            `SELECT * FROM quizzes
             WHERE folder_id = $1 AND user_id = $2
             ORDER BY created_at DESC`,
            [folderId, userId]
        );
        return result.rows;
    },

    async getQuizById(quizId) {
        // I have to add user_id to the database.questions table to ensure that only the owner can see the quiz
        // const result = await db.query(
        //     `SELECT * FROM questions
        //      WHERE quiz_id = $1 AND user_id = $2
        //      ORDER BY id`,
        //     [quizId, userId]
        // );
        const result = await db.query(
            `SELECT * FROM questions
             WHERE quiz_id = $1
             ORDER BY id`,
            [quizId]
        );
        return result.rows;
    },

    async deleteQuiz(quizId, userId) {
        await db.query(
            `DELETE FROM quizzes
             WHERE id = $1 AND user_id = $2`,
            [quizId, userId]
        );
    },

    // === QUESTIONS ===
    async addQuestion(quizId, question, options, correctOption, explanation) {
        const result = await db.query(
            `INSERT INTO questions (quiz_id, question, options, correct_option, explanation)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [quizId, question, options, correctOption, explanation]
        );
        return result.rows[0];
    },

    async deleteQuestion(questionId, userId) {
        await db.query(
            `DELETE FROM questions
             WHERE id = $1 AND quiz_id IN (
                 SELECT id FROM quizzes WHERE user_id = $2
             )`,
            [questionId, userId]
        );
    },

    async getQuestionsByQuiz(quizId) {
        const result = await db.query(
            `SELECT * FROM questions
             WHERE quiz_id = $1
             ORDER BY id`,
            [quizId]
        );
        return result.rows;
    },

    async getNextUnansweredQuestion(quizId, userId) {
        const result = await db.query(
            `SELECT q.*
             FROM questions q
             LEFT JOIN session_responses r 
               ON q.id = r.question_id AND r.user_id = $2
             WHERE q.quiz_id = $1 AND r.id IS NULL
             ORDER BY q.id
             LIMIT 1`,
            [quizId, userId]
        );
        return result.rows[0];
    },

    // === RESPONSES ===
    async submitAnswer(userId, quizId, questionId, selectedIndex, isCorrect) {
        const result = await db.query(
            `INSERT INTO session_responses
             (user_id, quiz_id, question_id, selected_index, is_correct)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, quizId, questionId, selectedIndex, isCorrect]
        );
        return result.rows[0];
    },

    async getScore(userId, quizId) {
        const result = await db.query(
            `SELECT COUNT(*) FILTER (WHERE is_correct) AS correct,
                    COUNT(*) AS total
             FROM session_responses
             WHERE user_id = $1 AND quiz_id = $2`,
            [userId, quizId]
        );
        return result.rows[0];
    },

    // === REVIEW HELPERS ===
    async getQuizIdsWithResponses(userId, folderId) {
        const result = await db.query(
            `SELECT DISTINCT q.id
             FROM quizzes q
             JOIN session_responses r ON q.id = r.quiz_id
             WHERE q.folder_id = $1 AND r.user_id = $2`,
            [folderId, userId]
        );
        return result.rows.map(row => row.id);
    },

    async getResponsesForQuiz(userId, quizId) {
        const result = await db.query(
            `SELECT * FROM session_responses
             WHERE user_id = $1 AND quiz_id = $2
             ORDER BY question_id`,
            [userId, quizId]
        );
        return result.rows;
    }
};

module.exports = dbService;
