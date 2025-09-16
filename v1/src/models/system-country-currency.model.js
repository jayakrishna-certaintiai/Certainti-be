const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const SystemCountryCurrency = sequelize.define('system_country_currency', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    country_name: {
        type: DataTypes.STRING(128),
        allowNull: false,
    },
    currency_unicode: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    currency_alpha_code: {
        type: DataTypes.STRING(8),
        allowNull: false,
    },
    fte_multiplier: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
    },
    subcon_multiplier: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
    }
}, {
    tableName: 'system_country_currency',
    timestamps: false,
});

module.exports = SystemCountryCurrency;
