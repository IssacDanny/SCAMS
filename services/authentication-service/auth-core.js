const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * A pure function to verify a password.
 * @param {string} password The plaintext password from the user.
 * @param {string} hash The stored password hash from the database.
 * @returns {boolean} True if the password is valid.
 */
const verifyPassword = (password, hash) => {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compareSync(password, hash);
};

/**
 * A pure function to generate a JWT that is compatible with Kong's consumer model.
 * @param {object} user The user payload to include in the token.
 * @param {string} secret The JWT secret key.
 * @returns {string} The signed JSON Web Token.
 */
const generateToken = (user, secret) => {
  const payload = {
    iss: 'generic-scams-user', // This MUST match the consumer we create
    sub: user.id,
    username: user.username,
    role: user.role
  };
  return jwt.sign(payload, secret, { expiresIn: '8h' });
};

/**
 * The main business logic function for logging in a user. This is a pure orchestrator.
 * It uses dependency injection for the 'user' object.
 * @param {object} credentials The user's login credentials { username, password }.
 * @param {object|null} user The user object fetched from the database.
 * @param {string} secret The JWT secret key.
 * @returns {{success: boolean, token?: string, error?: string}} An object indicating the result.
 */
const loginUser = (credentials, user, secret) => {
  if (!user) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const isPasswordValid = verifyPassword(credentials.password, user.passwordHash);

  if (!isPasswordValid) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const token = generateToken(user, secret);
  return { success: true, token };
};

module.exports = {
  loginUser
};