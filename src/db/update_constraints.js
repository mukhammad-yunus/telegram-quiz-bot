const db = require('../config/database');

async function updateConstraints() {
    try {
        // Drop existing foreign key constraints
        await db.query(`
            ALTER TABLE session_responses 
            DROP CONSTRAINT IF EXISTS session_responses_user_id_fkey,
            DROP CONSTRAINT IF EXISTS session_responses_quiz_id_fkey,
            DROP CONSTRAINT IF EXISTS session_responses_question_id_fkey;
        `);

        // Add new foreign key constraints with ON DELETE CASCADE
        await db.query(`
            ALTER TABLE session_responses
            ADD CONSTRAINT session_responses_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            ADD CONSTRAINT session_responses_quiz_id_fkey 
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
            ADD CONSTRAINT session_responses_question_id_fkey 
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
        `);

        console.log('Successfully updated foreign key constraints');
    } catch (error) {
        console.error('Error updating constraints:', error);
    } finally {
        // Close the pool
        await db.pool.end();
    }
}

// Run the update
updateConstraints(); 