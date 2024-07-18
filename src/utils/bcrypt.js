const bcrypt = require('bcrypt');

module.exports = {
    async SALT(password) {
        return bcrypt.hash(password, 10);
    },
    async COMPARE(password,passwordEncrypted){
        return bcrypt.compare(password, passwordEncrypted);
    }
};