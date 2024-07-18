const { Sequelize } = require('sequelize');
require('dotenv').config()

const { DB_HOST,DB_USER,DB_PASS,DB_DATABASE,DB_DEBUG } = process.env

/* Connection MYSQL */
const connection = new Sequelize(DB_DATABASE,DB_USER,DB_PASS || '',{
    host:DB_HOST,
    dialect:'mysql',
    logging:false
})

module.exports = connection