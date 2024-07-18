const request = require("request")

module.exports = function(config) {
    return new Promise(resolve => {
        request(config, (error, retorno, d1) => resolve(d1))
    })
}