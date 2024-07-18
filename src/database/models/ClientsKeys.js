const { DataTypes } = require('sequelize');
const connection = require('@database');

const ClientsKeys = connection.define('ClientsKeys', {
    client_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ips: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    webhook: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = ClientsKeys;