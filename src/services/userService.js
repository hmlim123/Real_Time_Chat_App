const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./pgClient');

const saltRounds = 10;
const secret = process.env.JWT_SECRET;

exports.createUser = async (username, email, password) => {
  const password_hash = await bcrypt.hash(password, saltRounds);

  const result = await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
    [username, email, password_hash]
  );

  const token = jwt.sign({ id: result.rows[0].id }, secret, { expiresIn: '1d' });

  return { ...result.rows[0], token };
};


exports.loginUser = async (email, password) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1d' });
  
  return {
  id: user.id,
  username: user.username,
  email: user.email,
  token,
  };
};
