const { DataTypes } = require('sequelize');
const connection = require('@database');

const Administrator = connection.define('Administrator', {
    mail: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rank: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = Administrator;