const { Router } = require("express");
const { createCompany,
        getCompanyList,
        getCompanyKPIs,
        getDetailsByCompany,
        getContactsByCompany,
        getProjectsByCompany,
        getCompanyHighlights,
        editCompany,
        getCompanyCurrency,
        triggerAi,
        toggleAutoInteractions,
        getCompanyFilterValues,
        getCCEmails,
        updateCCEmails,
        getCountryData
} = require("../controllers/company.controller.js");
const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");
const sequelize = require('../setups/db');
const companyRouter = Router()

//meta data api
companyRouter.get('/get-country-data', authorize_jwt, getCountryData);

// Public API routes for database integration (no authentication required)
// Get all companies/accounts
companyRouter.get('/public/get-companies', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.companyId,
                c.companyIdentifier,
                c.companyName,
                c.companyCode,
                c.industry,
                c.primaryCurrency,
                c.email,
                c.phone,
                c.website,
                c.companyType,
                c.projectsCount,
                c.employeesCount,
                c.annualRevenue,
                c.status,
                c.createdTime,
                c.modifiedTime,
                COUNT(p.projectId) as actualProjectsCount,
                SUM(CAST(COALESCE(p.s_total_project_cost, 0) AS DECIMAL(19,2))) as totalProjectCost,
                SUM(CAST(COALESCE(p.s_total_hours, 0) AS DECIMAL(19,2))) as totalProjectHours
            FROM company c
            LEFT JOIN projects p ON c.companyId = p.companyId
            GROUP BY c.companyId, c.companyIdentifier, c.companyName, c.companyCode, 
                     c.industry, c.primaryCurrency, c.email, c.phone, c.website, 
                     c.companyType, c.projectsCount, c.employeesCount, c.annualRevenue, 
                     c.status, c.createdTime, c.modifiedTime
            ORDER BY c.companyName ASC
            LIMIT 50
        `;

        const companies = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json({
            success: true,
            data: companies,
            message: 'Companies fetched successfully.',
            count: companies.length
        });

    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching companies.',
            error: error.message
        });
    }
});

// Get projects by company ID
companyRouter.get('/public/:companyId/get-projects', async (req, res) => {
    try {
        const { companyId } = req.params;

        const query = `
            SELECT 
                p.*,
                c.companyName as s_company_name,
                c.companyCode as s_company_code
            FROM projects p
            JOIN company c ON p.companyId = c.companyId
            WHERE p.companyId = ?
            ORDER BY p.modifiedTime DESC
            LIMIT 100
        `;

        const projects = await sequelize.query(query, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json({
            success: true,
            data: projects,
            message: `Projects for company ${companyId} fetched successfully.`,
            count: projects.length
        });

    } catch (error) {
        console.error('Error fetching projects by company:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching projects by company.',
            error: error.message
        });
    }
});

// Get company details by ID
companyRouter.get('/public/:companyId/details', async (req, res) => {
    try {
        const { companyId } = req.params;

        const query = `
            SELECT 
                c.*,
                COUNT(p.projectId) as actualProjectsCount,
                SUM(CAST(COALESCE(p.s_total_project_cost, 0) AS DECIMAL(19,2))) as totalProjectCost,
                SUM(CAST(COALESCE(p.s_total_hours, 0) AS DECIMAL(19,2))) as totalProjectHours,
                SUM(CAST(COALESCE(p.s_rd_credits, 0) AS DECIMAL(19,2))) as totalRdCredits
            FROM company c
            LEFT JOIN projects p ON c.companyId = p.companyId
            WHERE c.companyId = ?
            GROUP BY c.companyId
        `;

        const [company] = await sequelize.query(query, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found.',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: company,
            message: 'Company details fetched successfully.'
        });

    } catch (error) {
        console.error('Error fetching company details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching company details.',
            error: error.message
        });
    }
});

companyRouter.post("/:user/create-company", authorize_jwt, authorize('client', 'create'), createCompany);
companyRouter.get("/:user/get-companys-filter-values", authorize_jwt, getCompanyFilterValues);
companyRouter.get("/:user/get-company-list", authorize_jwt, getCompanyList);
companyRouter.get("/:user/:company/get-company-kpi", authorize_jwt, getCompanyKPIs);
companyRouter.get("/:user/:company/get-company-details", authorize_jwt, getDetailsByCompany);
companyRouter.get("/:user/:company/get-contacts-by-company", authorize_jwt, getContactsByCompany);
companyRouter.get("/:user/:company/get-projects-by-company", authorize_jwt, getProjectsByCompany);
companyRouter.get("/:user/:company/get-highlights", authorize_jwt, getCompanyHighlights);
companyRouter.put("/:user/:company/edit-company", authorize_jwt, authorize('client', 'update'), editCompany);
companyRouter.get("/:user/:companyId/get-currency", authorize_jwt, getCompanyCurrency);
companyRouter.post("/:companyId/trigger-ai", authorize_jwt, triggerAi);
companyRouter.post("/:companyId/:toggle/toggle-auto-interactions", authorize_jwt, toggleAutoInteractions);

// ccmails
companyRouter.get("/:companyId/ccmails", authorize_jwt, getCCEmails);
companyRouter.put("/:companyId/update-ccmails", authorize_jwt, updateCCEmails);


module.exports = companyRouter
