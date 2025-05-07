const express = require('express');
const pg = require('../services/pgClient'); // ✅ use PostgreSQL client
const router = express.Router();

router.post('/message', async (req, res) => {
    const { user, message } = req.body;

    if (!user || !message) {
        return res.status(400).json({ error: 'User and message are required' });
    }

    try {
        await pg.query(
            'INSERT INTO messages (username, content) VALUES ($1, $2)',
            [user, message]
        );
        res.json({ success: true, message: 'Message stored in PostgreSQL' });
    } catch (err) {
        console.error('❌ PostgreSQL error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/messages', async (req, res) => {
    try {
        const result = await pg.query(
            'SELECT * FROM messages ORDER BY created_at DESC LIMIT 50'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ PostgreSQL error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;

