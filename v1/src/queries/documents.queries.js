const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");

const Documents = require("../models/documents.model");

const documentQueries = {

    getDocumentFilterValues: async function (filter) {
        try {

            const { companyId, projectId } = filter;

            let whereConditions = [];
            let whereQuery = '';

            if (companyId) {
                let companyIdCondition = `company.companyId = '${companyId}'`;
                whereConditions.push(companyIdCondition);
            }

            if (projectId) {
                let projectIdCondition = `projects.projectId = '${projectId}'`;
                whereConditions.push(projectIdCondition);
            }

            whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

            const documentDataQuery = `
                SELECT
                    documents.originalFileName AS documentName,
                    documents.createdBy AS uploadedBy,
                    projects.projectId,
                    projects.projectCode,
                    projects.projectName
                FROM
                    documents
                JOIN
                    company ON company.companyId = documents.companyId
                LEFT JOIN
                    projects ON projects.projectId = documents.projectId
                ${whereQuery};
            `;

            const documentData = await sequelize.query(documentDataQuery, { type: Sequelize.QueryTypes.SELECT });

            let documentNameSet = new Set();
            let uploadedBySet = new Set();
            let projectIdSet = new Set();
            let projectCodeSet = new Set();
            let projectNameSet = new Set();

            for (const record of documentData) {
                if (record.documentName) documentNameSet.add(record.documentName);
                if (record.uploadedBy) uploadedBySet.add(record.uploadedBy);
                if (record.projectId) projectIdSet.add(record.projectId);
                if (record.projectCode) projectCodeSet.add(record.projectCode);
                if (record.projectName) projectNameSet.add(record.projectName);
            }

            let documentNames = Array.from(documentNameSet);
            let uploadedBy = Array.from(uploadedBySet);
            let projectIds = Array.from(projectIdSet);
            let projectCodes = Array.from(projectCodeSet);
            let projectNames = Array.from(projectNameSet);


            let documentType = ['Technical Documents', 'SOW', 'Project Status Reports', 'JIRA Dumps', 'Minutes of Meetings (MOMs)'];
            let status = ['unprocessed', 'processed'];

            return { documentNames, uploadedBy, projectIds, projectCodes, projectNames, documentType, status };

        } catch (error) {
            console.log("Error fetching employee filters list : ", error);
            throw error;
        }
    },

    getDocuments: async function (filter, sort) {
        try {

            let appliedSort = 'Uploaded On descending';
            let appliedFilterList = [];

            //filter
            let whereConditions = [];
            let whereQuery = '';

            const {
                documentNames,
                projectIds,
                projectCodes,
                projectNames,
                companyIds,
                categories,
                status,
                uploadedBy,
                startUploadedOn,
                endUploadedOn
            } = filter;

            if (documentNames && documentNames.length > 0) {
                const documentNameCondition = `documents.originalFileName in ('${documentNames.join("','")}')`;
                whereConditions.push(documentNameCondition);
                appliedFilterList.push('Document Name');
            }

            if (projectIds && projectIds.length > 0) {
                const projectIdCondition = `projects.projectId in ('${projectIds.join("','")}')`;
                whereConditions.push(projectIdCondition);
                appliedFilterList.push('Project ID');
            }

            if (projectCodes && projectCodes.length > 0) {
                const projectCodeCondition = `projects.projectCode in ('${projectCodes.join("','")}')`;
                whereConditions.push(projectCodeCondition);
                appliedFilterList.push('Project Code');
            }

            if (projectNames && projectNames.length > 0) {
                const projectNameCondition = `projects.projectName in ('${projectNames.join("','")}')`;
                whereConditions.push(projectNameCondition);
                appliedFilterList.push('Project Name');
            }

            if (companyIds && companyIds.length > 0) {
                const companyIdCondition = `documents.companyId in ('${companyIds.join("','")}')`;
                whereConditions.push(companyIdCondition);
                appliedFilterList.push('Account');
            }

            if (categories && categories.length > 0) {
                const categoriesCondition = `documents.documentType in ('${categories.join("','")}')`;
                whereConditions.push(categoriesCondition);
                appliedFilterList.push('Category');
            }

            if (status && status.length > 0) {
                const statusCondition = `documents.aistatus in ('${status.join("','")}')`;
                whereConditions.push(statusCondition);
                appliedFilterList.push('Status');
            }

            if (uploadedBy && uploadedBy.length > 0) {
                const uploadedByCondition = `documents.createdBy in ('${uploadedBy.join("','")}')`;
                whereConditions.push(uploadedByCondition);
                appliedFilterList.push('Uploaded By');
            }

            if (startUploadedOn || endUploadedOn) {
                const startDate = `${startUploadedOn} 00:00:00`;
                const endDate = `${endUploadedOn} 23:59:59`;

                const earliestDate = "0000-01-01 00:00:00";
                const latestDate = "9999-12-31 23:59:59";

                const sentCondition = `documents.createdTime BETWEEN "${startUploadedOn ? startDate : earliestDate}" AND "${endUploadedOn ? endDate : latestDate}"`;
                whereConditions.push(sentCondition);
            }

            whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';


            //sort
            const { sortField, sortOrder } = sort;
            let orderQuery = '';

            if (sortField && sortOrder) {
                orderQuery = 'ORDER BY';

                switch (sortField) {
                    case "documentName":
                        orderQuery += ` documents.originalFileName `;
                        appliedSort = 'Document Name';
                        break;
                    case "companyName":
                        orderQuery += ` company.companyName `;
                        appliedSort = 'Account';
                        break;
                    case "documentType":
                        orderQuery += ` documents.documentType `;
                        appliedSort = 'Category';
                        break;
                    case "rd_score":
                        orderQuery += ` rndDetails.rd_score `;
                        appliedSort = 'R&D Potential';
                        break;
                    case "aistatus":
                        orderQuery += ` documents.aistatus `;
                        appliedSort = 'Status';
                        break;
                    case "projectName":
                        orderQuery += ` projects.projectName `;
                        appliedSort = 'Projects';
                        break;
                    case "createdTime":
                        orderQuery += ` documents.createdTime `;
                        appliedSort = 'Uploaded On';
                        break;
                    case "createdBy":
                        orderQuery += ` documents.createdBy `;
                        appliedSort = 'Uploaded By';
                        break;
                }

                orderQuery = sortOrder == 'dsc' ? orderQuery + 'DESC' : orderQuery;
                appliedSort = sortOrder == 'dsc' ? appliedSort += ' descending' : appliedSort += ' ascending';
            } else {
                orderQuery = `ORDER BY documents.createdTime DESC `;
            }

            const query = `
                SELECT
                        documents.documentId,
                        documents.originalFileName AS documentName,
                        documents.documentName AS blobName,
                        documents.documentPath,
                        documents.documentType,
                        documents.aistatus,
                        documents.createdBy,
                        documents.createdTime,
                        company.companyId,
                        company.companyName,
                        projects.projectId,
                        projects.projectName,
                        rndDetails.rd_score
                FROM
                        documents
                JOIN
                        company ON company.companyId = documents.companyId
                LEFT JOIN
                        projects ON projects.projectId = documents.projectId
				LEFT JOIN
					(
						SELECT a.projectId,rd_score
                        FROM master_project_ai_assessment a
						WHERE a.status = 'active'
                    ) AS rndDetails ON rndDetails.projectId = documents.projectId
                
                ${whereQuery}
                ${orderQuery}
            `;

            const list = await sequelize.query(query, {
                type: Sequelize.QueryTypes.SELECT
            });

            let appliedFilter = appliedFilterList.length > 0 ? appliedFilterList.join(',') : 'None';

            return { list, appliedSort, appliedFilter };


        } catch (error) {
            console.log("Error fetching documents : ", error);
            throw error;
        }
    },


    uploadDocument: async function (body) {
        const data = await Documents.create(body)
        return body
    },
};

module.exports = documentQueries;