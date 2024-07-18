const { DataTypes } = require('sequelize');
const connection = require('@database');

const Payments = connection.define('Payments', {
    payment_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending"
    },
    payer_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    payer_document: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    qrcode: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    commit: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = Payments;