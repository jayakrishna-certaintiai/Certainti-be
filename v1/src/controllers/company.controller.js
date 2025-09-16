const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const companyQueries = require("../queries/company.queries");
const rolesQueries = require("../queries/roles.queries");
const { v4: uuidv4 } = require('uuid');
const authQueries = require("../queries/auth.queries");
const Company = require("../models/company.model");
const { axiosRequest } = require("../utils/axios");
const PlatformUsers = require("../models/platform-users.model");
const SystemCountryCurrency = require("../models/system-country-currency.model");


const getCountryData = async (req, res) => {
  try {
    const data = await companyQueries.getCountryData();
    return res.status(200).json(new ApiResponse(data, "Countries data fetch successfully", true));
  } catch (error) {
    console.log("Error fetching countrier data : ", error);
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getCompanyList = async (req, res) => {
  try {

    // await companyQueries.createDefaultCompanyMailConfigurations();

    const {
      sortField,
      sortOrder,
      accountIds,
      companyIds,
      billingCountries,
      primaryContacts,
      phones,
      emails,
      minTotalProjects,
      maxTotalProjects,
      sendInteractions,
      minTotalExpense,
      maxTotalExpense,
      minTotalRnDExpense,
      maxTotalRnDExpense } = req.query;

    const filter = {
      accountIds: accountIds ? JSON.parse(accountIds.replace(/'/g, '"')) : null,
      companyIds: companyIds ? JSON.parse(companyIds.replace(/'/g, '"')) : null,
      billingCountries: billingCountries ? JSON.parse(billingCountries.replace(/'/g, '"')) : null,
      primaryContacts: primaryContacts ? JSON.parse(primaryContacts.replace(/'/g, '"')) : null,
      phones: phones ? JSON.parse(phones.replace(/'/g, '"')) : null,
      emails: emails ? JSON.parse(emails.replace(/'/g, '"')) : null,
      minTotalProjects: minTotalProjects ? minTotalProjects : null,
      maxTotalProjects: maxTotalProjects ? maxTotalProjects : null,
      sendInteractions: sendInteractions ? sendInteractions : null,
      minTotalExpense: minTotalExpense ? minTotalExpense : null,
      maxTotalExpense: maxTotalExpense ? maxTotalExpense : null,
      minTotalRnDExpense: minTotalRnDExpense ? minTotalRnDExpense : null,
      maxTotalRnDExpense: maxTotalRnDExpense ? maxTotalRnDExpense : null
    }

    const sort = { sortField, sortOrder };

    const data = await companyQueries.getCompanies(filter, sort);

    return res.status(200).json(new ApiResponse(data, "Company list fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getCompanyFilterValues = async (req, res) => {
  try {
    const data = await companyQueries.getCompanyFilterValues();
    return res.status(200).json(new ApiResponse(data, "Company filters values fetched successfully.", true));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const createCompany = async (req, res) => {
  try {
    // Extract userId from request parameters
    const userId = req.params.user;

    // Fetch platform user details based on userId
    let platformUser = await PlatformUsers.findOne({ where: { userId: userId } });
    platformUser = platformUser.dataValues;

    // Define mandatory fields required for company creation
    const mandatoryData = {
      companyName: req.body.companyName,
      fiscalYear: req.body.fiscalYear,
      sequence: req.body.sequence
    };

    // Validate mandatory fields; return error if any field is missing
    for (const key in mandatoryData) {
      if (mandatoryData[key] == null) {
        return res.status(400).json(new ApiResponse(null, "Mandatory data missing", false));
      }
    }

    // Check if a company with the same name already exists
    const company = await Company.findOne({
      where: {
        companyName: req.body.companyName
      }
    });

    if (company) {
      return res.status(400).json(new ApiResponse(null, "Company name already exists", false));
    }

    //fetch country data
    let country = await SystemCountryCurrency.findOne({
      where: { id: mandatoryData.sequence }
    });
    country = country.dataValues;

    // Fetch the maximum company identifier to generate a unique company identifier
    const maxCompanyIdentifier = await Company.max('companyIdentifier');

    // Prepare company data for insertion
    const companyData = {
      companyId: uuidv4(), // Generate a unique company ID
      companyIdentifier: maxCompanyIdentifier + 1, // Assign a new identifier based on max existing value
      parentCompanyId: req.body.parentCompanyId ? req.body.parentCompanyId : null,
      companyName: req.body.companyName,
      companyCode: `CM${maxCompanyIdentifier + 1}`, // Generate company code
      billingCountry: country.country_name,
      industry: req.body.industry ? req.body.industry : null,
      primaryCurrency: country.currency_alpha_code,
      email: req.body.email ? req.body.email : null,
      phone: req.body.phone ? req.body.phone : null,
      companyType: req.body.companyType ? req.body.companyType : null,
      createdBy: platformUser.firstName + ' ' + platformUser.middleName + ' ' + platformUser.lastName, // Set creator details
      createdTime: new Date(), // Set creation timestamp
      currency: country.currency_alpha_code,
      currencySymbol: country.currency_unicode,
      fiscalYear: req.body.fiscalYear
    };

    // Insert new company record into the database
    await Company.create(companyData);

    // Insert necessary records for timesheet management
    const companyId = companyData.companyId;
    await companyQueries.insertCompanyNecessaryRecords(companyId);

    // Return success response
    return res
      .status(201)
      .json(
        new ApiResponse(null, "Company created successfully.")
      );
  } catch (error) {
    // Handle errors and return a server error response
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};



const getCompanyKPIs = async (req, res) => {
  try {
    const data = await companyQueries.companyKPIs(req.companyAccess)
    return res
      .status(200)
      .json(
        new ApiResponse(data, "KPIs Companies fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getDetailsByCompany = async (req, res) => {
  try {
    const data = await companyQueries.getDetailsByCompanyId(req.params.company);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Companies list fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getContactsByCompany = async (req, res) => {
  try {
    const data = await companyQueries.getContactListByCompany(req.params.company);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Contacts for company fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getProjectsByCompany = async (req, res) => {
  try {
    const data = await companyQueries.getProjectListByCompany(req.params.company);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Projects for company fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getCompanyHighlights = async (req, res) => {
  try {
    const data = await companyQueries.getHighlights(req.params.company);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Company Highlights fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const editCompany = async (req, res) => {
  try {
    const { user, company } = req.params;
    const userDetails = await authQueries.getUserProfile(user)
    console.log(userDetails);
    const userName = userDetails.firstName
    req.body.modifiedBy = userName
    const data = await companyQueries.editCompanyDetails(company, req.body);
    return res
      .status(201)
      .json(
        new ApiResponse(data, "Company details data saved successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getCompanyCurrency = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({
      where: {
        companyId: companyId
      }
    });

    if (!company) {
      return res.status(400).json(new ApiResponse(null, "Invalid company Id", false));
    }

    if (!company.dataValues.currencySymbol) {
      return res.status(400).json(new ApiResponse(null, "Company currency not found", false));
    }

    let companyCurrency = {
      currency: company.dataValues.currency,
      symbol: company.dataValues.currencySymbol
    };

    const codePoint = parseInt(companyCurrency.symbol, 16);
    const symbol = String.fromCharCode(codePoint);

    companyCurrency.symbol = symbol;

    return res.status(200).json(new ApiResponse(companyCurrency, "Currency fetched successfully", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const triggerAi = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findOne({
      where: {
        companyId: companyId
      }
    });

    if (!company) {
      return res.status(400).json(new ApiResponse(null, "Invalid company id", false));
    }

    const triggerSummary = axiosRequest(
      "post",
      process.env.AI_GENERATE_SUMMARY,
      {
        companyId: companyId
      }
    );

    return res.status(200).json(new ApiResponse(null, "AI triggered for the company", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const toggleAutoInteractions = async (req, res) => {
  try {
    const { companyId, toggle } = req.params;

    const company = await Company.findOne({
      where: {
        companyId: companyId
      }
    });

    if (!company) {
      return res.status(400).json(new ApiResponse(null, "Invalid company id", false));
    }

    await Company.update(
      { autoSendInteractions: toggle },
      { where: { companyId: companyId } }
    );

    return res.status(200).json(new ApiResponse(null, "Auto interactions will be sent to the account.", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getCCEmails = async (req, res) => {
  const { companyId } = req.params;
  const { purpose } = req.query;

  try {

    if (!companyId) {
      return res.status(400).json(new ApiError("Invalid or missing companyId", 400));
    }
    if (!purpose || !["SURVEY", "INTERACTION"].includes(purpose.toUpperCase())) {
      return res
        .status(400)
        .json(
          new ApiError("Invalid purpose. Must be 'SURVEY' or 'INTERACTION'", 400)
        );
    }

    const ccmails = await companyQueries.getCCEmailsByCompanyId(companyId, purpose.toUpperCase());
    return res
      .status(200)
      .json(
        new ApiResponse({ ccmails }, "ccEmails fetched successfully", true)
      );

  } catch (error) {
    console.error(`Error fetching ccEmails for companyId ${companyId}:`, error.message);
    return res.status(500).json(new ApiError(error.message, 500));
  }
};

const updateCCEmails = async (req, res) => {
  const { companyId } = req.params;
  const { purpose } = req.query;
  const { emails } = req.body;

  try {
    if (!companyId) {
      return res.status(400).json(new ApiError("Invalid or missing companyId", 400));
    }
    if (!purpose || !["SURVEY", "INTERACTION"].includes(purpose.toUpperCase())) {
      return res.status(400).json(new ApiError("Invalid purpose. Must be 'SURVEY' or 'INTERACTION'", 400));
    }

    const success = await companyQueries.updateCCEmailsByCompanyId(companyId, purpose.toUpperCase(), emails);

    if (!success) {
      return res.status(404).json(new ApiError("No changes made", 404));
    }

    return res
      .status(200)
      .json(
        new ApiResponse({}, "ccEmails updated successfully", true)
      );

  } catch (error) {
    console.error(`Error updating ccEmails for companyId ${companyId}:`, error.message);
    return res.status(500).json(new ApiError("Internal Server Error", 500));
  }
};


module.exports = {
  createCompany,
  getCompanyList,
  getDetailsByCompany,
  getContactsByCompany,
  getProjectsByCompany,
  getCompanyKPIs,
  getCompanyHighlights,
  editCompany,
  getCompanyCurrency,
  triggerAi,
  toggleAutoInteractions,
  getCompanyFilterValues,
  getCCEmails,
  updateCCEmails,
  getCountryData
}
