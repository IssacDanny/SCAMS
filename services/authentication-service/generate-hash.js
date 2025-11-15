const bcrypt = require('bcryptjs');

// This script generates a bcrypt hash for a given password.
// Usage: node generate-hash.js <your_password_here>

const password = process.argv[2];

if (!password) {
  console.error('Please provide a password as a command-line argument.');
  process.exit(1);
}

// The 'salt round' determines the computational cost. 10 is a good default.
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('Generated Hash:');
console.log(hash);