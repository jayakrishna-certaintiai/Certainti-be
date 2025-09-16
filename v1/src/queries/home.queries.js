const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");

const Project = require("../models/project.model");
const RecentlyViewed = require("../models/recently-viewed.model");

const homeQueries = {
    getKpis: async function (companyIds) {
        let whereClause1 = '';
        let whereClause2 = '';
        if (companyIds !== null) {
            whereClause1 = `WHERE pr.companyId IN (${companyIds.map(id => `'${id}'`).join(', ')})`;
            whereClause2 = `WHERE t.companyId IN(${companyIds.map(id => `'${id}'`).join(', ')})`;
        }
        // const [companyMetrics, dataRnD, dataRnDHours, projectClaimsQueue] = await Promise.all([
        //     sequelize.query(`
        //         SELECT
        //                 co.companyId,
        //                 co.companyName,
        //                 SUM(pr.TotalExpense) AS totalExpenseSum,
        //                 SUM(pr.RnDExpenseCumulative) AS rndExpenseCumulativeSum,
        //                 SUM(pr.RnDHoursCumulative) AS rndHoursCumulativeSum,
        //                 SUM(pr.uncertainHoursCumulative) AS uncertainHoursCumulativeSum,
        //                 SUM(rnd.RnDExpense) AS rndExpenseCumulativeSum
        //             FROM
        //                 projects AS pr
        //             LEFT JOIN
        //                 company AS co ON co.companyId = pr.companyId
        //             LEFT JOIN
        //                 (
        //                     SELECT
        //                         master_project_ai_assessment.projectId,
        //                         master_project_ai_assessment.rd_score,
        //                             rndExpense.TotalExpense,
        //                             rndExpense.TotalExpense / 100 * master_project_ai_assessment.rd_score AS RnDExpense
        //                     FROM 
        //                         master_project_ai_assessment
        //                     LEFT JOIN
        //                         projects ON projects.projectIdentifier = master_project_ai_assessment.projectId AND master_project_ai_assessment.status = 'active'
        //                     LEFT JOIN
        //                         (
        //                             SELECT
        //                                 projectIdentifier,
        //                                 SUM(TotalExpense) AS TotalExpense 
        //                             FROM
        //                                 projects 
        //                             GROUP BY projectIdentifier
        //                         ) AS rndExpense ON rndExpense.projectIdentifier = master_project_ai_assessment.projectId
        //                 ) AS rnd ON rnd.projectId = pr.projectIdentifier
        //                  ${whereClause1}
        //             GROUP BY 
        //                 co.companyId, co.companyName
        //             ORDER BY
        //                 co.companyName;
        //     `
        //     ),
        //     sequelize.query(`
        //         SELECT 
        //             JSON_ARRAYAGG(companyId) as companyId,
        //             JSON_ARRAYAGG(companyName) as companyName,
        //             JSON_ARRAYAGG(percentageRnD) as percentageRnD
        //         FROM (
        //             SELECT 
        //                 co.companyId,
        //                 co.companyName,
        //                 (SUM(pr.RnDExpenseCumulative) / SUM(pr.TotalExpense)) * 100 AS percentageRnD
        //             FROM 
        //                 projects AS pr
        //             JOIN 
        //                 company AS co ON co.companyId = pr.companyId
        //             ${whereClause1}
        //             GROUP BY 
        //                 co.companyId, co.companyName
        //             ORDER BY 
        //                 percentageRnD DESC
        //         ) subQuery;
        //     `,
        //         {
        //             type: Sequelize.QueryTypes.SELECT
        //         }),
        //     sequelize.query(`
        //         SELECT 
        //             JSON_ARRAYAGG(projectId) as projectId,
        //             JSON_ARRAYAGG(projectName) as projectName,
        //             JSON_ARRAYAGG(percentageRnDHours) as percentageRnDHour
        //         FROM (
        //             SELECT 
        //                 pr.projectId,
        //                 CONCAT(c.companyName, ' - ', pr.projectName) AS projectName,
        //                 CAST(ROUND(pr.uncertainHoursCumulative, 2) AS DECIMAL(10,2)) AS percentageRnDHours
        //             FROM 
        //                 projects AS pr
        //             JOIN
        //                 company AS c ON pr.companyId = c.companyId
        //             ${whereClause1}
        //             ORDER BY 
        //                 percentageRnDHours DESC
        //             LIMIT 5
        //         ) subQuery;
        //     `,
        //         {
        //             type: Sequelize.QueryTypes.SELECT
        //         }),
        //     sequelize.query(`
        //         SELECT 
        //             JSON_ARRAYAGG(timesheet) as timesheets,
        //             JSON_ARRAYAGG(totalUncertainHours) as totalUncertainHours
        //         FROM (
        //             SELECT 
        //                 CONCAT(c.companyName, ' - ', t.timesheetId) AS timesheet,
        //                 SUM(t.timesheetUncertainHours) AS totalUncertainHours
        //             FROM 
        //                 Timesheets AS t
        //             JOIN
        //                 company AS c ON t.companyId = c.companyId
        //             ${whereClause2}
        //             GROUP BY 
        //                 t.timesheetId, c.companyName
        //             ORDER BY
        //                 totalUncertainHours DESC
        //             LIMIT 5
        //         ) subQuery;
        //     `,
        //         {
        //             type: Sequelize.QueryTypes.SELECT
        //         })
        // ]);
        const companywiseMetricsQuery = `
                SELECT
                    company.companyId,
                    company.companyName,
                    CAST(SUM(projectsCost.totalCost * company.fteMultiplier) AS DOUBLE) AS totalExpenseSum,
                    CAST(SUM(projectsCost.totalRndCost * company.subconMultiplier) AS DOUBLE) AS rndExpenseCumulativeSum
                FROM
                    company
                JOIN
                    (
                        SELECT
						    projects.companyId,
                            SUM(COALESCE(s_fte_cost,0) + COALESCE(s_subcon_cost,0)) AS totalCost,
                            SUM(COALESCE(s_fte_cost,0) * (COALESCE(rd_score,0) + COALESCE(s_rnd_adjustment,0)) /100 + COALESCE(s_subcon_cost,0) * (COALESCE(rd_score,0) + COALESCE(s_rnd_adjustment,0)) /100) AS totalRndCost
                        FROM
                            projects
                        LEFT JOIN
                            master_project_ai_assessment ON master_project_ai_assessment.projectId = projects.projectId AND master_project_ai_assessment.status = 'active'
						GROUP BY projects.companyId
                    ) AS projectsCost ON projectsCost.companyId = company.companyId
                GROUP BY 
                    company.companyId, company.companyName
                ORDER BY
                    companyName;
            `;

        const companyMetrics = await sequelize.query(companywiseMetricsQuery, { type: Sequelize.QueryTypes.SELECT });

        return { companyWiseMetrics: companyMetrics };
    },
    getRVEntry: async function (filter) {
        const data = await RecentlyViewed.findAll({
            where: filter
        })
        return data;
    },
    updateRVEntry: async function (id, body) {
        const data = await RecentlyViewed.update(body, {
            where: {
                viewedId: id
            }
        });
    },
    createRVEntry: async function (body) {
        const data = await RecentlyViewed.create(body)
        return data;
    }
};

module.exports = homeQueries;