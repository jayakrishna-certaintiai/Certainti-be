const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const Contact = sequelize.define('Contact', {
  contactId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  companyId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  employeeTitle: {
    type: DataTypes.STRING(45),
  },
  employeeId: {
    type: DataTypes.STRING(45),
  },
  employementType: {
    type: DataTypes.STRING(45),
  },
  firstName: {
    type: DataTypes.STRING(45),
  },
  middleName: {
    type: DataTypes.STRING(45),
  },
  lastName: {
    type: DataTypes.STRING(45),
  },
  email: {
    type: DataTypes.STRING(45),
  },
  phone: {
    type: DataTypes.STRING(45),
  },
  address: {
    type: DataTypes.STRING(45),
  },
  language: {
    type: DataTypes.STRING(45),
  },
  status: {
    type: DataTypes.STRING(45),
  },
  statusDate: {
    type: DataTypes.DATE,
  },
  city: {
    type: DataTypes.STRING(45),
  },
  state: {
    type: DataTypes.STRING(45),
  },
  zipcode: {
    type: DataTypes.STRING(45),
  },
  description: {
    type: DataTypes.TEXT,
  },
  createdBy: {
    type: DataTypes.STRING(45),
  },
  createdTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  modifiedBy: {
    type: DataTypes.STRING(45),
  },
  modifiedTime: {
    type: DataTypes.DATE,
    onUpdate: DataTypes.NOW,
    defaultValue: DataTypes.NOW,
  },
  sysModTime: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'contacts', // Replace 'your_contact_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

// Now you can use the `Contact` model to interact with your database
module.exports = Contact;
