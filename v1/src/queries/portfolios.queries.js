const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");
const Portfolios = require("../models/portfolio.model");
const Portfolio_Projects_Rel = require("../models/portfolio-projects.model");

const portfolioQueries = {
    getPortfolios: async function (companyIds, minProjects= 0, maxProjects = 100000, recentlyViewed, user) {
        let whereClause = '';
        let whereClause1 = '';
        let joinQueries = '';

        if (companyIds !== null) {
            whereClause1 = `WHERE p.companyId IN (${companyIds?.map(id => `'${id}'`).join(', ')}) AND`;
        }

        if (recentlyViewed === 'true') {
            joinQueries += `
                LEFT JOIN recentlyViewed rv ON rv.viewedId = p.portfolioId 
            `;
            whereClause += `p.portfolioId IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'portfolio'`; 
        }

        const data = await sequelize.query(    
            `
            SELECT
            p.portfolioId AS portfolioId,
            p.PortfolioName AS name,
            COUNT(pr.projectId) AS projects,
            c.companyName AS client,
            c.companyId AS clientId,
            p.createdTime AS createdOn,
            p.createdBy AS contactId,
            pu.firstName AS contactFirstName,
            pu.middleName AS contactMiddleName,
            pu.lastName AS contactLastName,
            SUM(CAST(pj.RnDExpenseCumulative AS DECIMAL(19,4))) AS RnDExpenseCumulative
        FROM
            Portfolios p
        LEFT JOIN
            portfolio_projects_Rel pr ON p.portfolioId = pr.portfolioId
        LEFT JOIN
            projects pj ON pr.projectId = pj.projectId
        LEFT JOIN
            company c ON p.companyId = c.companyId
        LEFT JOIN
            platformUsers pu ON p.createdBy = pu.userId
        ${joinQueries}
        ${whereClause1}
        GROUP BY
            p.portfolioId, p.PortfolioName, c.companyName, p.createdTime, p.createdBy, pu.firstName, pu.middleName, pu.lastName
        HAVING
            COUNT(pr.projectId) BETWEEN :minProjects AND :maxProjects;

            `,
            {
                replacements: { companyIds, minProjects, maxProjects },
                type: Sequelize.QueryTypes.SELECT
            }
        )
        return data;
    },
      createPortfolio:  async function (
            portfolioId,
            PortfolioName,
            companyId,
            projectCount,
            user
        ) {
        const data = await Portfolios.create({
            portfolioId,
            PortfolioName, 
            companyId,
            projectCount, 
            portfolioRnDExpense : 0,
            createdBy: user,
        });
        return data;
      },
      createPortfolioRelation: async function (relations) {
        const data = await Portfolio_Projects_Rel.bulkCreate(relations);
        return data;
      },
}

module.exports = portfolioQueries;
