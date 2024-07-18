const JWT = require('jsonwebtoken');

module.exports = {
    async SIGN(data, key) {
        try {
            const jwt = JWT.sign(data, key, {expiresIn: '6h'});
            if(!jwt)
                return {status: false,message: 'Error to generate Authentication Token'}

            return {status: true,token: jwt,expires: '6h',message: 'Success'}

        } catch (error){
            return {status: false,message: error.message}
        }
    },
    
    async VERIFY(token, key) {
        try {
            const jwt = JWT.verify(token, key);
            if(!jwt)
                return {status: false,message: 'Invalid signature'}
            
            return {data: jwt,status: true,message: 'Success'}

        } catch (error) {
            return {status: false,message: error.message}
        }
    },

};