const express = require("express");
const router = express.Router();
const userService = require("../services/userService");

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  try {
    // Call your service to create user + token
    const user = await userService.createUser(username, email, password);

    // userService.createUser returns { id, username, email, created_at, token }
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or username already in use' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// LOGIN route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await userService.loginUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ user });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
