const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const sheetsQueries = require("../queries/sheets.queries")


const getUploadedSheets = async (req, res) => {
    try {

        const filters = {
            sheetTypes: req.query.sheetTypes ? JSON.parse(req.query.sheetTypes.replace(/'/g, '"')) : null,
            companyIds: req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null,
            uploadedBy: req.query.uploadedBy ? JSON.parse(req.query.uploadedBy.replace(/'/g, '"')) : null,
            status: req.query.status ? JSON.parse(req.query.status.replace(/'/g, '"')) : null,
        };

        const sort = {
            sortField: req.query.sortField,
            sortOrder: req.query.sortOrder
        };

        const capitalizeWords = (str) => {
            if (!str) return str;
            return str
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };
        
        const data = await sheetsQueries.getUploadedSheetsList(sort, filters);

        if (data.list && Array.isArray(data.list)) {
            data.list = data.list.map(sheet => ({
                ...sheet,
                sheet_type: capitalizeWords(sheet.sheet_type),
            }));
        }
        return res
            .status(200)
            .json(new ApiResponse(data, "Uploaded Sheets fetched successfully.")
        );
    } catch (error) {
        return res
            .status(500)
            .json(new ApiError(error.message, 500, error)
        );
    }
};

const getSheetFilterValues = async (req, res) => {
    try {

        const data = await sheetsQueries.getSheetFilterValues();

        return res
            .status(200)
            .json(
                new ApiResponse(data, "Uploaded sheets filter values fetched successfully.", true)
            );

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

module.exports = {
    getUploadedSheets,
    getSheetFilterValues,
};