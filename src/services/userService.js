const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./pgClient');

const saltRounds = 10;
const secret = process.env.JWT_SECRET;

exports.createUser = async (email, password) => {
  const password_hash = await bcrypt.hash(password, saltRounds);
  const result = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [email, password_hash]
  );
  return result.rows[0];
};

exports.loginUser = async (email, password) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1d' });
  return token;
};
