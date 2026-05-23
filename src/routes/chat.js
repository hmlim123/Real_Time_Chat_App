const express = require('express');
const pg = require('../services/pgClient'); // ✅ use PostgreSQL client
const authMiddleware = require('../middleware/authMiddleware'); // ✅ import authMiddleware
const router = express.Router();

// ✅ NEW: Fetch list of all rooms (for sidebar)
router.get("/rooms", authMiddleware, async (req, res) => {
  try {
    const result = await pg.query("SELECT id, name FROM rooms ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

router.post('/message', authMiddleware, async (req, res) => {
    const { roomId, message } = req.body;
    const userId = req.user.id;

    if (!roomId || !message) {
        return res.status(400).json({ error: 'roomId and message are required' });
    }

    try {
        const roomResult = await pg.query(
            "INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
            [roomId]
        );
        const dbRoomId = roomResult.rows[0].id;

        await pg.query(
            'INSERT INTO messages (user_id, content, room_id) VALUES ($1, $2, $3)',
            [userId, message, dbRoomId]
        );

        res.json({ success: true, message: 'Message stored in PostgreSQL' });
    } catch (err) {
        console.error('❌ PostgreSQL error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get("/rooms/:roomId/messages", authMiddleware, async (req, res) => {
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

