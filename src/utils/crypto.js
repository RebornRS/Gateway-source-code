const crypto = require('crypto')

const algorithm = 'aes-256-ctr'

const { HASH_SECRET } = process.env

module.exports = {
    async ENCRYPT(text, config) {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(algorithm, HASH_SECRET, iv)
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('hex')
        }
    },
    async DECRYPT(hash, config){
        const decipher = crypto.createDecipheriv(algorithm, HASH_SECRET, Buffer.from(hash.iv, 'hex'))
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])
        return decrpyted.toString()
    }
};