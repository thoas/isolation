var crypto = require('crypto');

exports.hash = function (msg, key) {
    return crypto.createHmac('sha256', key).update(msg).digest('hex');
}
