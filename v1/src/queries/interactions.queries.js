const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");

const Interactions = require("../models/interactions.model");

const recentlyViewed = require("../models/recentlyviewed.model");

const MasterInteractionQA = require("../models/MasterInteractionQA");


const interactions = {
    getInteractionsList: async function (
        user,
        company,
        interactionActivityTypeArr,
        relatedToArr,
        relationIdArr,
        interactionToArr,
        createdTimeArr,
        modifiedTimeArr,
        starred,
        statusArr
    ) {
        const whereClause = [];
        const replacements = {};
        replacements.user = user;
        if (interactionActivityTypeArr.length > 0) {
            whereClause.push('i.interactionActivityType IN (:interactionActivityTypeArr)');
            replacements.interactionActivityTypeArr = interactionActivityTypeArr;
        }
        if (relatedToArr.length > 0) {
            whereClause.push('i.relatedTo IN (:relatedToArr)');
            replacements.relatedToArr = relatedToArr;
        }
        if (statusArr.length > 0) {
            whereClause.push('i.status IN (:statusArr)');
            replacements.statusArr = statusArr;
        }
        if (relationIdArr.length > 0) {
            whereClause.push('i.relationId IN (:relationIdArr)');
            replacements.relationIdArr = relationIdArr;
        }
        if (interactionToArr.length > 0) {
            interactionToArr.forEach(email => {
                whereClause.push(`position('${email}' in i.interactionTo) > 0`);
            });
        }
        if (createdTimeArr.length > 0) {
            whereClause.push(`DATE_FORMAT(i.createdTime, '%Y-%m-%dT%H:%i') IN IN (:createdTimeArr)`);
            replacements.createdTimeArr = createdTimeArr;
        }
        if (modifiedTimeArr.length > 0) {
            whereClause.push(`DATE_FORMAT(i.modifiedTime, '%Y-%m-%dT%H:%i') IN (:modifiedTimeArr)`);
            replacements.modifiedTimeArr = modifiedTimeArr;
        }
        if (starred !== undefined && starred !== null) {
            if (starred) {
                // Include starred interactions
                whereClause.push('rv.IsStarred = 1');
            } else {
                // Exclude starred interactions
                whereClause.push('(rv.IsStarred = 0 OR i.IsStarred IS NULL)');
            }
        }
        try {
            const data = await sequelize.query(`
                SELECT i.*, co.companyName, pr.projectName, rv.isStarred
                FROM Interactions i
                JOIN company co ON co.companyId = i.companyId
                JOIN projects pr ON pr.projectId = i.projectId
                LEFT JOIN (
                    SELECT *
                    FROM recentlyViewed
                    WHERE createdBy = :user
                ) rv ON rv.viewedId = i.interactionID
                ${whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''}
                ORDER BY i.modifiedBy DESC
            `, {
                replacements: replacements,
                type: sequelize.QueryTypes.SELECT
            });

            return data;
        } catch (error) {
            console.error('Error retrieving interactions list:', error);
            throw error;
        }
    },
    getInteractionTrail: async function (interactionId) {
        const i_data = await Interactions.findOne({
            where: {
                interactionID: interactionId
            }
        });

        const c_id = i_data.conversationId;
        const data = await sequelize.query(
            `
                SELECT i.* , co.companyName, pr.projectName
                FROM 
                    Interactions i
                JOIN company co ON co.companyId = i.companyId
                JOIN projects pr ON pr.projectId = i.projectId
                WHERE conversationId = :c_id 
                ORDER BY sysModTime DESC`,
            {
                replacements: { c_id },
                type: sequelize.QueryTypes.SELECT
            }
        );
        return data;
    },
    createInteractionFromWorkbench: async function (body) {
        const data = Interactions.create({

        })
    },
    createActivity: async function (body) {
        const data = await Interactions.create({
            conversationId: null,
            companyId: body.companyId,
            interactionTo: body.interactionTo,
            interactionFrom: body.interactionFrom,
            ccRecipients: body.ccRecipients ? body.ccRecipients : null,
            interactionTime: new Date(Date.now()),
            interactionActivityType: body.interactionActivityType,
            interactionSubject: body.interactionSubject ? body.interactionSubject : null,
            interactionDesc: body.interactionDesc ? body.interactionDesc : null,
            relatedTo: body.relatedTo,
            relationId: body.relationId,
            createdBy: body.createdBy ? body.createdBy : null,
            modifiedBy: body.modifiedBy ? body.modifiedBy : null
        });

        return data;
    },
    getInteractionByFilter: async function (filters, company) {
        const data = await Interactions.findAll({
            // where:{
            //     ...filters,
            // }
        });
        return data;
    },
    starActivity: async function (interactionId, user, isStarred) {
        // Update isStarred column in recentlyViewed table
        const updatedData = await recentlyViewed.findOrCreate({
            where: {
                viewedId: interactionId,
                createdBy: user
            },
            defaults: {
                viewedId: interactionId,
                viewedEntity: 'Interaction',
                isStarred
            }
        });
        if (!updatedData[1]) {
            // If entry already exists, update isStarred column
            await recentlyViewed.update(
                { isStarred: isStarred ? 1 : 0 },
                {
                    where: {
                        viewedId: interactionId
                    }
                }
            );
        }

        return updatedData;
    },

        updateInteractionQADetails: async function (interactionId, qaList, modifiedBy) {
        const modifiedTime = new Date();

        const promises = qaList.map((qa) => {
            // Check if question has valid character length (at least 50 characters)
            if (qa.question && qa.question.length >= 50) {
                // Update the entry if question length is valid
                return MasterInteractionQA.update(
                    {
                        question: qa.question,
                        answer: qa.answer,
                        modifiedby: modifiedBy,
                        modifiedtime: modifiedTime
                    },
                    {
                        where: {
                            id: qa.id,
                            interactionsid: interactionId
                        }
                    }
                );
            } else {
                // Delete the entry if question length is invalid
                return MasterInteractionQA.destroy({
                    where: {
                        id: qa.id,
                        interactionsid: interactionId
                    }
                });
            }
        });

        return Promise.all(promises);
    },

    deleteInteraction: async function (companyId, InteractionID) {
        const data = await Interactions.destroy({
            where: {
                InteractionID, companyId
            },
        });
        return data;
    },


}

module.exports = interactions;
