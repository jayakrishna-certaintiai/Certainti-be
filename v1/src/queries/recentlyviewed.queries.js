const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");

const RecentlyViewed = require("../models/recentlyviewed.model");

const recentlyViewed = {
    getRecentlyViewedList: async function getRecentlyViewedList(recentlyViewedFilters, user) {
        try {
            let replacements = {};
            let whereClause = '';
            let joinQueries = '';
            let selectQueries = 'SELECT rv.rvid, rv.viewedUITime '
    
            if (recentlyViewedFilters === 'company') {
                joinQueries = `LEFT JOIN company c ON rv.viewedId = c.companyId`;
                whereClause += `AND c.companyId IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'company'`;
                selectQueries += ', c.*'
            }
            if (recentlyViewedFilters === 'contact') {
                joinQueries += `
                    LEFT JOIN contacts c ON rv.viewedId = c.contactId
                `;
                whereClause += `AND c.contactId IS NOT NULL AND rv.createdBy = '${user}'  AND rv.viewedEntity = 'contact'`; 
                selectQueries += ', c.*'
            }
            

            if (recentlyViewedFilters === 'portfolio') {
                joinQueries += `
                    LEFT JOIN Portfolios c ON rv.viewedId = c.portfolioId 
                `;
                whereClause += `AND c.portfolioId IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'portfolio'`; 
                selectQueries += ', c.*'
            }

            if (recentlyViewedFilters === 'projects') {
                joinQueries += `
                    LEFT JOIN projects c ON rv.viewedId = c.projectId 
                `;
                whereClause += `AND c.projectId IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'projects'`; 
                selectQueries += ', c.*'
            }

            if (recentlyViewedFilters === 'workflow') {
                joinQueries += `
                    LEFT JOIN Workflow c ON rv.viewedId = c.workflowId 
                `;
                whereClause += `AND c.workflowId IS NOT NULL AND rv.createdBy = '${user} AND rv.viewedEntity = 'workflow''`; 
                selectQueries += ', c.*'
            }
            // Reports Table not found
            // if (recentlyViewedFilters === 'report') {
            //     joinQueries += `
            //         LEFT JOIN contacts c ON rv.viewedId = c.contactId AND rv.viewedEntity = 'report'
            //     `;
            //     whereClause += `AND c.contactId IS NOT NULL AND rv.createdBy = '${user}'`; 
            //     selectQueries += ', c.*'
            // }

            if (recentlyViewedFilters === 'activity') {
                joinQueries += `
                    LEFT JOIN Interactions c ON rv.viewedId = c.interactionID  
                `;
                whereClause += `AND c.interactionID IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'activity'`; 
                selectQueries += ', c.*'
            }

            if (recentlyViewedFilters === 'timesheet') {
                joinQueries += `
                    LEFT JOIN Timesheets c ON rv.viewedId = c.timesheetId 
                `;
                whereClause += `AND c.timesheetId IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'timesheet'`; 
                selectQueries += ', c.*'
            }

            if (recentlyViewedFilters === 'workbench') {
                joinQueries += `
                    LEFT JOIN Reconciliations c ON rv.viewedId = c.reconcileId 
                `;
                whereClause += `AND c.reconcileId IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'workbench'`; 
                selectQueries += ', c.*'
            }

            if (recentlyViewedFilters === 'documents') {
                joinQueries += `
                    LEFT JOIN Documents c ON rv.viewedId = c.documentId
                `;
                whereClause += `AND c.documentId IS NOT NULL AND rv.createdBy = '${user}'  AND rv.viewedEntity = 'documents'`; 
                selectQueries += ', c.*'
            }

            if (recentlyViewedFilters === 'alerts') {
                joinQueries += `
                    LEFT JOIN Alerts c ON rv.viewedId = c.alertId 
                `;
                whereClause += `AND c.alertId IS NOT NULL AND rv.createdBy = '${user}' AND rv.viewedEntity = 'alerts'`; 
                selectQueries += ', c.*'
            }

            if(!joinQueries && !whereClause){
                return []
            }
            const data = await sequelize.query(
                `
                    ${selectQueries}
                    FROM recentlyViewed rv
                    ${joinQueries}
                    WHERE 1=1 ${whereClause}
                    ORDER BY rv.modifiedTime DESC;
                `,
                {
                    replacements: replacements,
                    type: sequelize.QueryTypes.SELECT
                }
            );
    
            return data;
        } catch (error) {
            console.error('Error fetching recently viewed list:', error);
            throw error;
        }
    },
    
    createRecentlyViewedItem: async function (
        viewedId,
        viewedEntity,
        userId,
        viewedUITime,
    ){  
        const updatedData = await RecentlyViewed.findOrCreate({
            where: {
                viewedId: viewedId,
                createdBy: userId
            },
            defaults: {
                viewedId,
                viewedEntity,
                viewedUITime,
                createdBy: userId
            }
        });
        if (!updatedData[1]) {
            // If entry already exists, update column
            await RecentlyViewed.update(
                {
                    viewedUITime,
                },
                {
                    where: {
                        viewedId: viewedId,
                        createdBy: userId
                    }
                }
            );
        }
        return updatedData;
    },

    deleteRecentlyViewedItem: async function (
        rvid
    ){
        const data = await RecentlyViewed.destroy({
            where: {
                rvid
            },
        });
        return data;
    },
}

module.exports = recentlyViewed