const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const documentQueries = require("../queries/documents.queries");
const authQueries = require("../queries/auth.queries");
const { axiosRequest } = require("../utils/axios");
const { uploadFileToAzureStorage, downloadFileFromAzureStorage } = require('../utils/azureBlobStorage');


const getDocumentFilterValues = async (req, res) => {
    try {

        const filter = {
            companyId: req.query.companyId,
            projectId: req.query.projectId
        }

        const data = await documentQueries.getDocumentFilterValues(filter);

        return res.status(200).json(new ApiResponse(data, "Documents filters values fetched successfully.", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getAllDocuments = async (req, res) => {
    try {

        const filter = {
            documentNames: req.query.documentNames ? JSON.parse(req.query.documentNames.replace(/'/g, '"')) : null,
            projectIds: req.query.projectIds ? JSON.parse(req.query.projectIds.replace(/'/g, '"')) : null,
            projectCodes: req.query.projectCodes ? JSON.parse(req.query.projectCodes.replace(/'/g, '"')) : null,
            projectNames: req.query.projectNames ? JSON.parse(req.query.projectNames.replace(/'/g, '"')) : null,
            companyIds: req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null,
            categories: req.query.documentType ? JSON.parse(req.query.documentType.replace(/'/g, '"')) : null,
            status: req.query.status ? JSON.parse(req.query.status.replace(/'/g, '"')) : null,
            uploadedBy: req.query.uploadedBy ? JSON.parse(req.query.uploadedBy.replace(/'/g, '"')) : null,
            startUploadedOn: req.query.startUploadedOn ? JSON.parse(req.query.startUploadedOn.replace(/'/g, '"')) : null,
            endUploadedOn: req.query.endUploadedOn ? JSON.parse(req.query.endUploadedOn.replace(/'/g, '"')) : null
        }

        const sort = {
            sortField: req.query.sortField,
            sortOrder: req.query.sortOrder
        }

        const data = await documentQueries.getDocuments(filter, sort);

        return res
            .status(200)
            .json(
                new ApiResponse(data, "Documents fetched successfully.")
            );
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const uploadDocuments = async (req, res) => {
    try {
        const { user } = req.params;
        const userDetails = await authQueries.getUserProfile(user)
        const userName = userDetails.firstName + " " + userDetails.lastName;
        const { companyId, relatedTo, relationId, docType } = req.body;
        const files = req.files;

        if (!companyId || !relatedTo || !relationId || !docType) {
            return res.status(422).json(
                new ApiError(
                    "File not found, Upload again, or missing fields.",
                    422
                )
            )
        }

        const aiStatus = relatedTo == 'clients' ? "client-document" : "unprocessed";

        let data = []

        for (let file of files) {
            const uploadFile = await uploadFileToAzureStorage(file)

            const projectId = relatedTo == 'projects' ? relationId : null;
            let body = {
                companyId: companyId,
                relatedTo: relatedTo,
                relationId: relationId,
                documentType: docType,
                documentPath: uploadFile.url,
                documentName: uploadFile.blobName,
                documentSize: file.size,
                createdBy: userName,
                modifiedBy: userName,
                aistatus: aiStatus,
                projectId: projectId,
                originalFileName: file.originalname
            }
            const data1 = await documentQueries.uploadDocument(body);
            data.push(data1)
        }

        if (relatedTo == 'projects') {
            const triggerSummary = axiosRequest(
                "post",
                process.env.AI_GENERATE_SUMMARY,
                {
                    companyId: companyId,
                    projectId: relationId
                }
            );
            console.log(`Document | action:Trigger AI Summary | projectId=${relationId} | companyId=${companyId}`);
        }


        return res
            .status(200)
            .json(
                new ApiResponse(data, "Documents uploaded successfully.")
            );
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const downloadDocument = async (req, res) => {
    try {
        const fileName = req.params.filename;
        if (!fileName) {
            return res.status(400).json(new ApiResponse(null, "File name missing."));
        }
        // Call the function to download the file
        await downloadFileFromAzureStorage(fileName, res);
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};




module.exports = {
    getAllDocuments,
    uploadDocuments,
    downloadDocument,
    getDocumentFilterValues
    //   getInteractions,
    //   getInteractionDetail,
    //   createNewActivity,
    //   deleteInteraction,
    //   getInteractionByFilter
}