const express = require('express');
const pg = require('../services/pgClient'); // ✅ use PostgreSQL client
const router = express.Router();

router.post('/message', async (req, res) => {
    const { user, message } = req.body;

    if (!user || !message) {
        return res.status(400).json({ error: 'User and message are required' });
    }

    try {

        // ✅ [ADDED] Fetch user_id from the users table based on the username
        const userResult = await pg.query(
            'SELECT id FROM users WHERE username = $1',
            [user]
        );

        // ✅ [ADDED] Handle case where user is not found
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        // ✅ [UPDATED] Store message with user_id instead of username
        await pg.query(
            'INSERT INTO messages (user_id, content) VALUES ($1, $2)',
            [userId, message]
        );

        res.json({ success: true, message: 'Message stored in PostgreSQL' });
    } catch (err) {
        console.error('❌ PostgreSQL error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// If you don’t already have this:
router.get("/rooms/:roomId/messages", async (req, res) => {
    const { roomId } = req.params;

    try {
        const result = await pg.query(
        `SELECT m.content, m.created_at, u.username
        FROM messages m
        JOIN users u ON m.user_id = u.id
        JOIN rooms r ON m.room_id = r.id
        WHERE r.name = $1
        ORDER BY m.created_at DESC
        LIMIT 50`,
        [roomId]
        );

        res.json(result.rows.reverse());
    } catch (err) {
        console.error("❌ Failed to fetch room messages:", err);
        res.status(500).json({ error: "Failed to load messages" });
    }
});


module.exports = router;

