const crypto = require('crypto');
module.exports = (token) =>
  crypto.createHash('sha256').update(String(token), 'utf8').digest('hex');
