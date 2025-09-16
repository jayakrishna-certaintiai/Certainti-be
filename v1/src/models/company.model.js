const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const Company = sequelize.define('Company', {
  companyIdentifier: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    get() {
      // Get function to format the companyIdentifier value as 'CO-XXXXX'
      const formattedIdentifier = 'CO-' + String(this.getDataValue('companyIdentifier')).padStart(7, '0');
      return formattedIdentifier;
    }
  },
  companyId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  parentCompanyId: {
    type: DataTypes.STRING(45),
  },
  companyName: {
    type: DataTypes.STRING(45),
  },
  companyCode: {
    type: DataTypes.STRING(45),
  },
  billingAddress: {
    type: DataTypes.STRING(45),
  },
  billingState: {
    type: DataTypes.STRING(45),
  },
  billingCountry: {
    type: DataTypes.STRING(45),
  },
  billingCity: {
    type: DataTypes.STRING(45),
  },
  shippingAddress: {
    type: DataTypes.STRING(45),
  },
  shippingCity: {
    type: DataTypes.STRING(45),
  },
  shippingState: {
    type: DataTypes.STRING(45),
  },
  shippingCountry: {
    type: DataTypes.STRING(45),
  },
  industry: {
    type: DataTypes.STRING(45),
  },
  primaryCurrency: {
    type: DataTypes.STRING(45),
  },
  email: {
    type: DataTypes.STRING(45),
  },
  phone: {
    type: DataTypes.STRING(45),
  },
  website: {
    type: DataTypes.STRING(45),
  },
  fax: {
    type: DataTypes.STRING(45),
  },
  primaryContact: {
    type: DataTypes.STRING(45),
  },
  secondaryContact: {
    type: DataTypes.STRING(45),
  },
  companyType: {
    type: DataTypes.STRING(45),
  },
  projectsCount: {
    type: DataTypes.STRING(45),
  },
  portfoliosCount: {
    type: DataTypes.STRING(45),
  },
  employeesCount: {
    type: DataTypes.STRING(45),
  },
  annualRevenue: {
    type: DataTypes.STRING(45),
  },
  taxConsultant: {
    type: DataTypes.STRING(45),
  },
  SLA: {
    type: DataTypes.STRING(45),
  },
  SLASerialNumber: {
    type: DataTypes.STRING(45),
  },
  SLAExpiration: {
    type: DataTypes.STRING(45),
  },
  noOfLocation: {
    type: DataTypes.STRING(45),
  },
  status: {
    type: DataTypes.STRING(45),
  },
  statusDate: {
    type: DataTypes.DATE,
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
  sysModDate: {
    type: DataTypes.DATE,
  },
  currency: {
    type: DataTypes.STRING(8),
  },
  currencySymbol: {
    type: DataTypes.STRING(4)
  },
  autoSendInteractions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ccmails: {
    type: DataTypes.TEXT,
  },
  fiscalYear: {
    type: DataTypes.STRING(4),
  },
  interactionccMails: {
    type: DataTypes.TEXT
  },
  disclaimer: {
    type: DataTypes.TEXT
  },
  fteMultiplier: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.0
  },
  subconMultiplier: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.0
  }

}, {
  tableName: 'company', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
  // hooks: {
  //   beforeCreate: (company, options) => {
  //     // Format the companyIdentifier value as CO-XXXXX
  //     const formattedIdentifier = 'CO-' + String(company.companyIdentifier).padStart(5, '0');
  //     company.companyIdentifier = formattedIdentifier;
  //   }
  // }
});

// Now you can use the `Company` model to interact with your database
module.exports = Company;
