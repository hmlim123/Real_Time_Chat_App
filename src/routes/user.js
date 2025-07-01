// routes/user.js
const express = require("express");
const pg = require("../services/pgClient");
const router = express.Router();

router.post("/register", async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username required" });
    }

    try {
        const result = await pg.query(
            "INSERT INTO users (username) VALUES ($1) RETURNING *",
            [username]
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        if (err.code === "23505") { // unique violation
            return res.status(409).json({ error: "Username already taken" });
        }
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
