const { DataTypes } = require('sequelize');
const connection = require('@database');

const Clients = connection.define('Clients', {
    mail: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    document: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    balance: {
        type: DataTypes.FLOAT,
        defaultValaue:0.00
    },
    topt: {
        type: DataTypes.TEXT,
        defaultValue:null
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    zipcode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    income: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:true,
    },
}, {
    timestamps: true,
});

module.exports = Clients;