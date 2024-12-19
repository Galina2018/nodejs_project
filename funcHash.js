const bcrypt = require('bcryptjs');

// async function hashPassword(password) {
//   try {
//     const salt = await bcrypt.genSalt(10);
//     return await bcrypt.hash(password, salt);
//   } catch (error) {
//     throw new Error('Hashing failed', error);
//   }
// }

async function verifyUser(login, storedLogin, password, storedPassword) {
  const usernameMatched = login === storedLogin;
  const passwordMatched = await bcrypt.compare(password, storedPassword);

  if (usernameMatched && passwordMatched) {
    console.log('OK: Verification is successful.');
    return true;
  } else {
    console.error('ERR: Verification failed.');
    return false;
  }
}

module.exports = {
  // hashPassword,
  verifyUser,
};
