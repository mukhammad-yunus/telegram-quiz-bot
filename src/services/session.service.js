/**
 * Session Service
 * Manages user sessions using Map instead of ctx.session
 */

class SessionService {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Get or create a session for a user
   * @param {number} userId - Telegram user ID
   * @returns {Object} User session object
   */
  getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        stage: null,
        quizTitle: null,
        quizDescription: null,
        folderId: null,
        quiz: [],
        currentChunkArrayIndex: 0,
        quizzes: [],
        currentQuiz: null,
        questions: [],
        timerSeconds: null,
        quizAnswers: [],
        score: 0,
        currentQuestionIndex: 0,
        chatId: null,
      });
    }
    return this.sessions.get(userId);
  }

  /**
   * Update a user's session
   * @param {number} userId - Telegram user ID
   * @param {Object} updates - Session updates to apply
   */
  updateSession(userId, updates) {
    const session = this.getSession(userId);
    Object.assign(session, updates);
    this.sessions.set(userId, session);
  }

  /**
   * Reset a user's session
   * @param {number} userId - Telegram user ID
   */
  resetSession(userId) {
    this.sessions.delete(userId);
  }

  /**
   * Check if a user has an active session
   * @param {number} userId - Telegram user ID
   * @returns {boolean}
   */
  hasSession(userId) {
    return this.sessions.has(userId);
  }

    /**
   * Get the current question number in the format [current/total]
   * @param {number} userId - Telegram user ID
   * @returns {string} Question number in format [current/total]
   */
    getCurrentQuestionNumber(userId) {
      const session = this.getSession(userId);
      return `[${session.currentQuestionIndex + 1}/${session.questions.length}]`;
    }

  /**
   * Add an answer to the current quiz session
   * @param {number} userId - Telegram user ID
   * @param {Object} answer - Answer object containing questionId, selectedIndex, isCorrect
   */
  addQuizAnswer(userId, answer) {
    const session = this.getSession(userId);
    session.quizAnswers.push(answer);
    if (answer.isCorrect) {
      session.score++;
    }
    this.sessions.set(userId, session);
  }

  /**
   * Get all answers for the current quiz session
   * @param {number} userId - Telegram user ID
   * @returns {Array} Array of answer objects
   */
  getQuizAnswers(userId) {
    const session = this.getSession(userId);
    return session.quizAnswers;
  }

  /**
   * Clear quiz answers for a user
   * @param {number} userId - Telegram user ID
   */
  clearQuizAnswers(userId) {
    const session = this.getSession(userId);
    session.quizAnswers = [];
    this.sessions.set(userId, session);
  }
  /**
   * Set the chat ID for the current quiz session
   * @param {number} userId - Telegram user ID
   * @param {number} chatId - Chat ID where the quiz is being conducted
   */
  setChatId(userId, chatId) {
    const session = this.getSession(userId);
    session.chatId = chatId;
    this.sessions.set(userId, session);
  }
}

// Create a singleton instance
const sessionService = new SessionService();

module.exports = sessionService; 