const express = require('express');
const redisClient = require('../services/redisClient');

const router = express.Router();

router.post('/message', async (req, res) => {
    const { user, message } = req.body;

    if (!user || !message) {
        return res.status(400).json({ error: 'User and message are required' });
    }

    // Store the message in Redis (simulate chat history)
    await redisClient.lPush('chat_messages', JSON.stringify({ user, message }));

    res.json({ success: true, message: 'Message stored in Redis' });
});

// Fetch latest chat messages
router.get('/messages', async (req, res) => {
    const messages = await redisClient.lRange('chat_messages', 0, -1);
    res.json(messages.map(msg => JSON.parse(msg)));
});

module.exports = router;
