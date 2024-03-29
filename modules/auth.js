// Hashing
const bcryptjs = require('bcryptjs');
const saltRounds = 10;

/**
 * To encrypt a password
 * @param {String} pwd the password to encrypt 
 * @returns a crypted version of the given password
 */
function encrypt_pwd(pwd) {
    return bcryptjs.hash(pwd, saltRounds)
}

/**
 * To decrypt a password
 * @param {String} pwd password to check
 * @param {String} hash hash to compare with
 * @returns true if password match
 */
function check_pwd(pwd,hash) {
    return bcryptjs.compareSync(pwd,hash)
}

module.exports = {encrypt_pwd, check_pwd}