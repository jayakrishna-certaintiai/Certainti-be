const { BlobServiceClient } = require("@azure/storage-blob");
const path = require('path');

// Your Azure Storage account connection string
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Your container name
const CONTAINER_NAME = process.env.CONTAINER_NAME;

async function uploadFileToAzureStorage(file) {
    try {
        // Check if the file object is valid
        if (!file || !file.path || !file.originalname || !file.mimetype) {
            throw new Error("Invalid file object");
        }

        // Create a BlobServiceClient using the provided connection string
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

        // Get a reference to a container
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Get a block blob client with a unique name (you can customize the blob name here)
        let currentDate = new Date();
        // Extract components from the current Date object
        let day = currentDate.getDate().toString().padStart(2, '0');
        let month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed, so add 1
        let year = currentDate.getFullYear();
        let hours = currentDate.getHours().toString().padStart(2, '0');
        let minutes = currentDate.getMinutes().toString().padStart(2, '0');
        let seconds = currentDate.getSeconds().toString().padStart(2, '0');
        let milliseconds = currentDate.getMilliseconds().toString().padStart(3, '0');
        // Format the date and time
        let formattedDateTime = `${day}:${month}:${year}-${hours}:${minutes}:${seconds}:${milliseconds}`;

        const blobName = `${formattedDateTime}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload the file to Azure Storage
        const uploadBlobResponse = await blockBlobClient.uploadFile(file.path, {
            blobHTTPHeaders: { blobContentType: file.mimetype }
        });

        console.log("File uploaded successfully.");

        // fs.unlinkSync(file.path);

        // Generate the URL for the uploaded blob
        const url = blockBlobClient.url;

        return { uploadBlobResponse, url, blobName };
    } catch (error) {
        console.error("Error uploading file to Azure Storage:", error.message);
        throw error;
    }
}


async function downloadFileFromAzureStorage(blobName, res) {
    try {
        // Create a BlobServiceClient object using the connection string
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

        // Get a reference to a container
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Get a block blob client
        const blobClient = containerClient.getBlobClient(blobName);

        // Download the blob content
        const downloadBlockBlobResponse = await blobClient.download();

        // Set the content type based on the blob's content type
        res.setHeader("Content-Type", downloadBlockBlobResponse.contentType);

        // Stream the blob content to the response
        downloadBlockBlobResponse.readableStreamBody.pipe(res);
    } catch (error) {
        console.error("Error downloading file from Azure Storage:", error.message);
        throw error;
    }
}

async function uploadSheetToAzure(file) {
    try {
        // Check if the file object is valid
        if (!file || !file.path || !file.originalname || !file.mimetype) {
            throw new Error("Invalid file object");
        }

        // Create a BlobServiceClient using the provided connection string
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

        // Get a reference to a container
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Get a block blob client with a unique name (you can customize the blob name here)
        let currentDate = new Date();
        // Extract components from the current Date object
        let day = currentDate.getDate().toString().padStart(2, '0');
        let month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed, so add 1
        let year = currentDate.getFullYear();
        let hours = currentDate.getHours().toString().padStart(2, '0');
        let minutes = currentDate.getMinutes().toString().padStart(2, '0');
        let seconds = currentDate.getSeconds().toString().padStart(2, '0');
        let milliseconds = currentDate.getMilliseconds().toString().padStart(3, '0');
        // Format the date and time
        let formattedDateTime = `${day}:${month}:${year}-${hours}:${minutes}:${seconds}:${milliseconds}`;

        const blobName = `${formattedDateTime}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload the file to Azure Storage
        const uploadBlobResponse = await blockBlobClient.uploadFile(file.path, {
            blobHTTPHeaders: { blobContentType: file.mimetype }
        });

        console.log("File uploaded successfully.");

        // fs.unlinkSync(file.path);

        // Generate the URL for the uploaded blob
        const url = blockBlobClient.url;

        return { uploadBlobResponse, url, blobName };
    } catch (error) {
        console.error("Error uploading file to Azure Storage:", error.message);
        return { status: 'failed', message: 'Failed to upload to cloud' };
    }
}


module.exports = {
    uploadFileToAzureStorage,
    downloadFileFromAzureStorage,
    uploadSheetToAzure
};