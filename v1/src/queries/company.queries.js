const { Sequelize, Op, UUIDV4 } = require("sequelize");
const sequelize = require("../setups/db");
const Company = require("../models/company.model");
const Contact = require("../models/contact.model");
const Project = require("../models/project.model");
const MasterCompanyMailConfiguration = require("../models/master-company-mail-configuration.model");
const { v4: uuidv4 } = require("uuid");
const { companyDefaultMailConfigurations } = require('../constants');


const companyQueries = {

    insertCompanyNecessaryRecords: async function (companyId) {
        try {
            await sequelize.query(
                'CALL InsertMasterMapperAttributes(:companyId)',
                {
                    replacements: { companyId },
                    type: Sequelize.QueryTypes.RAW
                }
            );

        } catch (error) {
            console.log("Error fetching countries data : ", error);
            throw error;
        }
    },

    getCountryData: async function () {
        try {
            const query = `
                SELECT
                        id AS sequence,
                        country_name AS countryName,
                        currency_unicode AS currencySymbol,
                        currency_alpha_code AS currency
                FROM
                        system_country_currency
                ORDER BY
                        id;
            `;

            const data = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });

            return data;
        } catch (error) {
            console.log("Error fetching countries data : ", error);
            throw error;
        }
    },

    createDefaultCompanyMailConfigurations: async function () {
        try {

            //define feature as key and purposes as an array
            const options = {
                SURVEY: ['OTP', 'SEND', 'REMINDER', 'RESPONSE RECEIVED - USER', 'RESPONSE RECEIVED - SUPPORT TEAM'],
                INTERACTION: ['OTP', 'SEND', 'REMINDER', 'RESPONSE RECEIVED - USER', 'RESPONSE RECEIVED - SUPPORT TEAM'],
                //LOGIN: ['OTP LOGIN', 'OTP FORGOT PASSWORD', 'OTP 2FA RESET']
            }

            //get companyIds list
            let companies = await Company.findAll({
                attributes: ['companyId']
            });
            companies = companies.map(company => company.companyId);

            //create default entries for non-existing
            for (const companyId of companies) {
                for (const feature in options) {
                    for (const purpose of options[feature]) {

                        const mailConfig = await MasterCompanyMailConfiguration.findOne({
                            where: {
                                companyid: companyId,
                                feature: feature,
                                purpose: purpose,
                            },
                        });

                        if (!mailConfig) {
                            await companyQueries.getOrCreateCompanyMailConfiguration(companyId, feature, purpose);
                        }
                    }
                }
            }

        } catch (error) {
            console.log("Error creating company mail configuration : ", error);
        }
    },

    getOrCreateCompanyMailConfiguration: async function (companyId, feature, purpose) {
        try {

            let masterCompanyMailConfiguration = await MasterCompanyMailConfiguration.findOne({
                where: {
                    companyid: companyId,
                    feature: feature,
                    purpose: purpose
                }
            });

            if (!masterCompanyMailConfiguration) {
                const subject = companyDefaultMailConfigurations[feature][purpose].subject;
                const body = companyDefaultMailConfigurations[feature][purpose].body;

                const masterCompanyMailConfigurationData = {
                    id: uuidv4(),
                    companyid: companyId,
                    feature: feature,
                    purpose: purpose,
                    subject: subject,
                    body: body,
                }

                await MasterCompanyMailConfiguration.create(masterCompanyMailConfigurationData);
            }

            masterCompanyMailConfiguration = await MasterCompanyMailConfiguration.findOne({
                where: {
                    companyid: companyId,
                    feature: feature,
                    purpose: purpose
                }
            });

            return masterCompanyMailConfiguration;
        } catch (error) {
            throw error;
        }
    },

    getCompanyFilterValues: async function () {
        try {

            const companyDataQuery = `
                SELECT
                        companyIdentifier,
                        companyName,
                        fiscalYear,
                        billingCountry,
                        primaryContact,
                        phone,
                        email
                FROM
                        company
                ORDER BY
                        companyIdentifier;
            `;

            const companyData = await sequelize.query(companyDataQuery, { type: Sequelize.QueryTypes.SELECT });

            let comapnyIdentifierSet = new Set();
            let companyNameSet = new Set();
            let fiscalYearSet = new Set();
            let billingCountrySet = new Set();
            let primaryContactSet = new Set();
            let phoneSet = new Set();
            let emailSet = new Set();

            for (const record of companyData) {
                if (record.companyIdentifier) comapnyIdentifierSet.add(record.companyIdentifier);
                if (record.companyName) companyNameSet.add(record.companyName);
                if (record.fiscalYear) fiscalYearSet.add(record.fiscalYear);
                if (record.billingCountry) billingCountrySet.add(record.billingCountry);
                if (record.primaryContact) primaryContactSet.add(record.primaryContact);
                if (record.phone) phoneSet.add(record.phone);
                if (record.email) emailSet.add(record.email);
            }


            let companyIdentifiers = Array.from(comapnyIdentifierSet).sort();
            let companyNames = Array.from(companyNameSet).sort();
            let fiscalYears = Array.from(fiscalYearSet).sort();
            let billingCountries = Array.from(billingCountrySet).sort();
            let primaryContacts = Array.from(primaryContactSet).sort();
            let phones = Array.from(phoneSet).sort();
            let emails = Array.from(emailSet).sort();


            return { companyIdentifiers, companyNames, fiscalYears, billingCountries, primaryContacts, phones, emails };

        } catch (error) {
            console.log("Error fetching company filter values : ", error);
            throw error;
        }
    },

    getCompanies: async function (filter, sort) {
        try {

            let appliedSort = 'Account ID ascending';
            let appliedFilterList = [];

            //filter
            let flterQuery = `WHERE `;
            let filtersArray = [];

            const {
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
                maxTotalRnDExpense
            } = filter;

            if (accountIds && accountIds.length > 0) {
                const accountIdQuery = `company.companyIdentifier in ('${accountIds.join("','")}')`;
                filtersArray.push(accountIdQuery);
                appliedFilterList.push('Account ID');
            }

            if (companyIds && companyIds.length > 0) {
                const companyIdQuery = `company.companyId in ('${companyIds.join("','")}')`;
                filtersArray.push(companyIdQuery);
                appliedFilterList.push('Company ID');
            }

            if (billingCountries && billingCountries.length > 0) {
                const billingCountryQuery = `company.billingCountry in ('${billingCountries.join("','")}')`;
                filtersArray.push(billingCountryQuery);
                appliedFilterList.push('Billing Country');
            }

            if (primaryContacts && primaryContacts.length > 0) {
                const primaryContactQuery = `company.primaryContact in ('${primaryContacts.join("','")}')`;
                filtersArray.push(primaryContactQuery);
                appliedFilterList.push('Billing Country');
            }

            if (phones && phones.length > 0) {
                const phoneQuery = `company.phone in ('${phones.join("','")}')`;
                filtersArray.push(phoneQuery);
                appliedFilterList.push('Primary Contact');
            }

            if (emails && emails.length > 0) {
                const emailQuery = `company.email in ('${emails.join("','")}')`;
                filtersArray.push(emailQuery);
                appliedFilterList.push('Email Address');
            }

            if (minTotalProjects || maxTotalProjects) {
                let totalProjectsQuery = `projectsData.projectCount BETWEEN ${minTotalProjects ? minTotalProjects : 0} AND  ${maxTotalProjects ? maxTotalProjects : Number.MAX_SAFE_INTEGER} `;
                filtersArray.push(totalProjectsQuery);
                appliedFilterList.push('Total Projects');
            }

            if (sendInteractions) {
                let sendInteractionsQuery = `company.autoSendInteractions = '${sendInteractions}' `;
                filtersArray.push(sendInteractionsQuery);
                appliedFilterList.push('Auto Send Interaction');
            }

            if (minTotalExpense || maxTotalExpense) {
                let totalExpenseQuery = `(projectsData.totalExpense BETWEEN ${minTotalExpense ? minTotalExpense : 0} AND  ${maxTotalExpense ? maxTotalExpense : Number.MAX_SAFE_INTEGER} OR projectsData.totalExpense IS NULL) `;
                filtersArray.push(totalExpenseQuery);
                appliedFilterList.push('Total Expense');
            }

            if (minTotalRnDExpense || maxTotalRnDExpense) {
                let totalRnDExpenseQuery = `(projectsData.totalRnDExpense BETWEEN ${minTotalRnDExpense ? minTotalRnDExpense : 0} AND  ${maxTotalRnDExpense ? maxTotalRnDExpense : Number.MAX_SAFE_INTEGER} OR projectsData.totalRnDExpense IS NULL) `;
                filtersArray.push(totalRnDExpenseQuery);
                appliedFilterList.push('Total R&D Expense');
            }

            flterQuery = flterQuery + filtersArray.join(" AND ");
            if (flterQuery == "WHERE ") {
                flterQuery = "";
            }

            //sort
            const { sortField, sortOrder } = sort;
            let orderQuery = `ORDER BY company.companyIdentifier ASC `;

            if (sortField && sortOrder) {
                switch (sortField) {
                    case "companyName": orderQuery = `ORDER BY company.companyName `;
                        appliedSort = 'Account Name';
                        break;
                    case "companyIdentifier": orderQuery = `ORDER BY company.companyIdentifier `;
                        appliedSort = 'Account ID';
                        break;
                    case "totalProjects": orderQuery = `ORDER BY projectsCount `;
                        appliedSort = 'Total Projects';
                        break;
                    case "billingCountry": orderQuery = `ORDER BY company.billingCountry `;
                        appliedSort = 'Billing Country';
                        break;
                    case "autoSendInteractions": orderQuery = `ORDER BY company.autoSendInteractions `;
                        appliedSort = 'Auto Send Interaction';
                        break;
                    case "totalExpense": orderQuery = `ORDER BY CAST(NULLIF(totalProjectCost, '') AS SIGNED) `;
                        appliedSort = 'Total Expense';
                        break;
                    case "totalRnDExpense": orderQuery = `ORDER BY CAST(NULLIF(totalRnDCost, '') AS SIGNED) `;
                        appliedSort = 'Total R&D Expense';
                        break;
                    case "primaryContact": orderQuery = `ORDER BY company.primaryContact `;
                        appliedSort = 'Primary Contact';
                        break;
                    case "phone": orderQuery = `ORDER BY company.phone `;
                        appliedSort = 'Phone';

                        break;
                    case "email": orderQuery = `ORDER BY company.email `;
                        appliedSort = 'Email Address';
                        break;
                }

                if (sortOrder == 'dsc') {
                    orderQuery += 'DESC';
                    appliedSort += ' descending';
                } else {
                    orderQuery += 'ASC';
                    appliedSort += ' ascending';
                }
            }

            const sqlQuery = `
                SELECT 
                    company.companyId, 
                    company.companyName, 
                    company.companyIdentifier, 
                    company.billingCountry, 
                    company.autoSendInteractions, 
                    company.primaryContact, 
                    company.phone, 
                    company.email, 
                    company.currency, 
                    company.currencySymbol,
                    projectsData.projectCount AS projectsCount,
                    SUM(projectsData.fte_cost + projectsData.subcon_cost) AS totalProjectCost, 
                    SUM(projectsData.qre_fte_cost * company.fteMultiplier + projectsData.qre_subcon_cost * company.subconMultiplier) AS totalRnDCost 
                FROM company 
                LEFT JOIN ( 
                    SELECT 
                        projects.companyId, 
                        COUNT(projects.projectId) AS projectCount, 
                        SUM(s_fte_cost) AS fte_cost, 
                        SUM(s_subcon_cost) AS subcon_cost, 
                        SUM(s_fte_cost * (master_project_ai_assessment.rd_score/100 + COALESCE(projects.s_rnd_adjustment, 0) / 100)) AS qre_fte_cost, 
                        SUM(s_subcon_cost * (master_project_ai_assessment.rd_score/100 + COALESCE(projects.s_rnd_adjustment, 0) / 100)) AS qre_subcon_cost 
                    FROM projects  
                    LEFT JOIN master_project_ai_assessment 
                        ON master_project_ai_assessment.projectId = projects.projectId 
                        AND master_project_ai_assessment.status = 'active' 
                    GROUP BY projects.companyId
                ) AS projectsData ON projectsData.companyId = company.companyId
                ${flterQuery}
                GROUP BY 
                    company.companyId, 
                    company.companyName, 
                    company.companyIdentifier, 
                    company.billingCountry, 
                    company.autoSendInteractions, 
                    company.primaryContact, 
                    company.phone, 
                    company.email, 
                    company.currency, 
                    company.currencySymbol
                ${orderQuery};
            `;

            const list = await sequelize.query(sqlQuery,
                {
                    type: Sequelize.QueryTypes.SELECT
                }
            );

            let appliedFilter = appliedFilterList.length > 0 ? appliedFilterList.join(',') : 'None';

            return { list, appliedSort, appliedFilter };

        } catch (error) {
            console.log("Error fetching company list : ", error);
            throw error;
        }
    },

    getDetailsByCompanyId: async function (companyId) {
        const sqlQuery = `
            SELECT
                company.*,
                projectsData.totalProjects,
                projectsData.totalCosts,
                projectsData.totalRnDCosts
            FROM
                company
            LEFT JOIN
                (
                    SELECT
                        companyId,
                        COUNT(*) AS totalProjects,
                        SUM(totalCosts) AS totalCosts,
                        SUM(totalRnDCosts) AS totalRnDCosts
                    FROM
                        projects
                    WHERE companyId = '${companyId}'
                    GROUP BY companyId
                ) AS projectsData ON projectsData.companyId = company.companyId
            WHERE
                company.companyId = '${companyId}';
        `;

        const details = await sequelize.query(sqlQuery, { type: Sequelize.QueryTypes.SELECT });

        return details[0];
    },


    getContactListByCompany: async function (companyId) {
        const data = await Contact.findAll({
            where: {
                companyId
            },
            order: [['modifiedTime', 'DESC']]
        });
        return data;
    },
    getProjectListByCompany: async function (companyId) {

        const data1 = await sequelize.query(
            `
                SELECT p.*, ct.contactId, ct.firstName, ct.lastName, ct.middleName
                FROM projects p
                LEFT JOIN TeamMembers tm ON tm.teamMemberId = p.projectManagerId
                LEFT JOIN contacts ct ON ct.contactId = tm.contactId
                WHERE p.companyId = :companyId
                ORDER BY p.TotalExpense DESC;
            `,
            {
                replacements: { companyId },
                type: Sequelize.QueryTypes.SELECT
            }
        )
        // const data = await Project.findAll({
        //     where: {
        //         companyId
        //     }
        // });
        return data1;
    },
    getHighlights: async function (companyId) {
        const data = await sequelize.query(
            `
            SELECT 
                SUM(TotalBudget) as totalBudget, 
                SUM(totalCosts) as totalExpense, 
                SUM(totalRnDCosts) as rndExpenseCumulative
            FROM projects
            WHERE projects.companyId = :companyId;
            `,
            {
                replacements: { companyId },
                type: Sequelize.QueryTypes.SELECT
            }
        );

        const data1 = await sequelize.query(
            `
            select
            0 as totalBudget,
            sum(taskTotalExpense) as totalExpense,
            sum(RnDExpense) as rndExpenseCumulative,
            month(taskDate) as month,
            year(taskDate) as year
            from
                timesheettasks a
            where
                companyId = :companyId
            group by
            month(taskDate) , year(taskDate)
            `,
            {
                replacements: { companyId },
                type: Sequelize.QueryTypes.SELECT
            }
        )
        return { highlights: data, kpi: data1 };
    },
    editCompanyDetails: async function (companyId, body) {
        const data = await Company.update(body, {
            where: {
                companyId
            }
        });
        return data;
    },
    createCompanyDetails: async function (body) {
        const data = await Company.create(body);
        return data;
    },
    companyKPIs: async function (companyIds) {
        let whereClause1 = '';
        let whereClause2 = '';
        if (companyIds !== null) {
            whereClause1 = `WHERE pr.companyId IN (${companyIds.map(id => `'${id}'`).join(', ')})`;
            whereClause2 = `WHERE t.companyId IN(${companyIds.map(id => `'${id}'`).join(', ')})`;
        }
        const [[kpi1], [kpi2], [kpi3]] = await Promise.all([
            sequelize.query(
                `
                SELECT 
                    JSON_ARRAYAGG(companyId) as companyId,
                    JSON_ARRAYAGG(companyName) as companyName,
                    JSON_ARRAYAGG(percentageRnD) as percentageRnD
                FROM (
                    SELECT 
                        co.companyId,
                        co.companyName,
                        (SUM(pr.RnDExpenseCumulative) / SUM(pr.TotalExpense)) * 100 AS percentageRnD
                    FROM 
                        projects AS pr
                    JOIN 
                        company AS co ON co.companyId = pr.companyId
                    ${whereClause1}
                    GROUP BY 
                        co.companyId, co.companyName
                    ORDER BY 
                        percentageRnD DESC
                    LIMIT 5
                ) as subQuery;
                `,
                {
                    type: Sequelize.QueryTypes.SELECT
                }
            ),
            sequelize.query(
                `
                SELECT 
                    JSON_ARRAYAGG(companyId) as companyId,
                    JSON_ARRAYAGG(companyName) as companyName,
                    JSON_ARRAYAGG(uncertainHours) as uncertainHours
                FROM (
                    SELECT 
                        co.companyId,
                        co.companyName,
                        SUM(pr.uncertainHoursCumulative) AS uncertainHours
                    FROM 
                        projects AS pr
                    JOIN 
                        company AS co ON co.companyId = pr.companyId
                    ${whereClause1}
                    GROUP BY
                        co.companyId, co.companyName
                    ORDER BY 
                        uncertainHours DESC
                    LIMIT 5
                ) as subQuery;
                `,
                {
                    type: Sequelize.QueryTypes.SELECT
                }
            ),
            sequelize.query(
                `
                SELECT 
                    JSON_ARRAYAGG(timesheet) as timesheets,
                    JSON_ARRAYAGG(totalUncertainHours) as totalUncertainHours
                FROM (
                    SELECT 
                        CONCAT(c.companyName, ' - ', t.timesheetId) AS timesheet,
                        SUM(t.timesheetUncertainHours) AS totalUncertainHours
                    FROM 
                        Timesheets AS t
                    JOIN
                        company AS c ON t.companyId = c.companyId
                    ${whereClause2}
                    GROUP BY 
                        t.timesheetId, c.companyName
                    ORDER BY
                        totalUncertainHours DESC
                    LIMIT 5
                ) subQuery; 
                `,
                {
                    type: Sequelize.QueryTypes.SELECT
                }
            )
        ])

        return { kpi1, kpi2, kpi3 }
    },
    isCompanyExists: async function (filters) {
        const conditions = [];
        // if (filters.companyId) {
        //     conditions.push({ companyId: filters.companyId });
        // }
        // if (filters.email) {
        //     conditions.push({ email: filters.email });
        // }
        if (filters.companyName) {
            conditions.push({ companyName: filters.companyName });
        }

        // Find a company matching any one of the conditions
        const data = await Company.findOne({
            where: {
                [Op.or]: conditions
            }
        });

        return data;
    },


    getCCEmailsByCompanyId: async (companyId, purpose) => {
        try {
            let column = '';
            if (purpose === 'SURVEY') {
                column = 'ccmails';
            } else if (purpose === 'INTERACTION') {
                column = 'interactionccMails';
            } else {
                return [];
            }

            const company = await Company.findOne({
                attributes: [column],
                where: { companyId },
            });

            if (company && company[column]) { // Dynamically access the selected column
                return company[column]
                    .split(',')
                    .map(email => email.trim()) // Remove unnecessary spaces
                    .filter(Boolean); // Filter out empty values
            }
            return [];
        } catch (error) {
            console.error(`Error fetching ccEmails for companyId ${companyId}:`, error.message);
            throw new Error("Database error occurred while fetching ccEmails.");
        }
    },

    updateCCEmailsByCompanyId: async (companyId, purpose, emails) => {
        try {
            let column = '';
            if (purpose === 'SURVEY') {
                column = 'ccmails';
            } else if (purpose === 'INTERACTION') {
                column = 'interactionccMails';
            } else {
                throw new Error("Invalid purpose. Must be 'SURVEY' or 'INTERACTION'");
            }

            const updatedRows = await Company.update(
                { [column]: emails.join(',') }, // Convert array to comma-separated string
                { where: { companyId } }
            );

            return updatedRows[0] > 0; // Returns true if rows were updated, false otherwise
        } catch (error) {
            console.error(`Error updating ccEmails for companyId ${companyId}:`, error.message);
            throw new Error("Database error occurred while updating ccEmails.");
        }
    },
};

module.exports = companyQueries
