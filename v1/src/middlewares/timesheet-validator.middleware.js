const { ApiError } = require("../utils/ApiError");
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const PDFParser = require('pdf-parse');
const mammoth = require('mammoth');

const allowedExtensions = ['.csv', '.xls', '.xlsx'];
const allowedMimeTypes = ['application/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

// const isSuspiciousContent = (content) => {
//     const suspiciousPatterns = [
//         /<script[\s\S]*?>[\s\S]*?<\/script>/gi,  // Detects script tags
//         /eval\(/gi,                             // Detects eval function
//         /javascript:/gi,                        // Detects javascript URLs
//         /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,  // Detects iframe tags
//         /<object[\s\S]*?>[\s\S]*?<\/object>/gi,  // Detects object tags
//         /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi,    // Detects embed tags
//         /<applet[\s\S]*?>[\s\S]*?<\/applet>/gi,  // Detects applet tags
//         /<form[\s\S]*?>[\s\S]*?<\/form>/gi       // Detects form tags
//     ];

//     return suspiciousPatterns.some(pattern => pattern.test(content));
// };

// const validateExcelContent = async (content) => {
//     try {
//         const workbook = xlsx.read(content, { type: 'buffer' });
//         const firstSheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[firstSheetName];
//         const jsonContent = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

//         if (jsonContent.length === 0) {
//             throw new ApiError('Excel file is empty.', 422);
//         }

//         // Check for suspicious content
//         for (const row of jsonContent) {
//             for (const cell in row) {
//                 if (isSuspiciousContent(row[cell])) {
//                     throw new ApiError('Suspicious content detected in Excel file.', 422);
//                 }
//             }
//         }

//         return; // No issues found, resolve successfully
//     } catch (error) {
//         throw new ApiError('Error parsing Excel file.', 500, error);
//     }
// };


const validateTimesheet = async (req, res, next) => {
    try {
        const file = req.file;

        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileMimeType = file.mimetype;

        if (!allowedExtensions.includes(fileExtension) || !allowedMimeTypes.includes(fileMimeType)) {
            return res.status(422).json(
                new ApiError("Invalid file type. Only CSV and Excel files are allowed.", 422)
            );
        }

        // const fileContent = fs.readFileSync(file.path);

        // if (fileExtension === '.xls' || fileExtension === '.xlsx') {
        //     try {
        //         await validateExcelContent(fileContent);
        //     } catch (error) {
        //         if (error instanceof ApiError && error.status === 422) {
        //             return res.status(422).json(error); // Return the specific error message
        //         } else {
        //             throw error; // Re-throw other errors for centralized handling
        //         }
        //     }
        // }

        next();
    } catch (error) {
        return res.status(422).json({
            message: "Invalid file type. Only CSV and Excel files are allowed.",
            success: false,
            error: error
        });
    }
}

const docAllowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.msg', '.ppt', '.pptx', ...allowedExtensions];
const docAllowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-outlook',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream',
    ...allowedMimeTypes
];

// const validatePDFContent = async (file) => {
//     try {
//         const dataBuffer = fs.readFileSync(file.path);
//         const pdfContent = await PDFParser(dataBuffer);

//         if (isSuspiciousContent(pdfContent.text)) {
//             throw new ApiError('Suspicious content detected in PDF file.', 422);
//         }
//     } catch (error) {
//         throw new ApiError('Error reading or validating PDF file.', 500, error);
//     }
// };
// const validateWordContent = async (file) => {
//     try {
//         const result = await mammoth.extractRawText({ path: file.path });
//         const content = result.value;  // Extracted text content from Word document

//         if (isSuspiciousContent(content)) {
//             throw new ApiError('Suspicious content detected in Word file.', 422);
//         }
//     } catch (error) {
//         throw new ApiError('Error reading or validating Word file.', 500, error);
//     }
// };
const validateDocument = async (req, res, next) => {
    try {
        const files = req.files;
        const MAX_FILE_SIZE = process.env.DOCUMENT_UPLOAD_SIZE_LIMIT * 1024 * 1024; // 10 MB in bytes

        for (let file of files) {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            const fileMimeType = file.mimetype;

            if (!docAllowedExtensions.includes(fileExtension) || !docAllowedMimeTypes.includes(fileMimeType)) {
                return res.status(422).json(
                    new ApiError("Invalid file type. Only PDF, Word, and Excel files are allowed.", 422)
                );
            }

            const fileSize = file.size;
            if (fileSize > MAX_FILE_SIZE) {
                return res.status(422).json(
                    new ApiError(`File size exceeds the limit of ${process.env.DOCUMENT_UPLOAD_SIZE_LIMIT} MB.`, 422)
                );
            }
            //     switch (fileExtension) {
            //         case '.pdf':
            //             await validatePDFContent(file);
            //             break;
            //         case '.doc':
            //             await validateWordContent(file);
            //             break;
            //         case '.docx':
            //             await validateWordContent(file);
            //             break;
            //         case '.xls':
            //             await validateExcelContent(file);
            //             break;
            //         case '.xlsx':
            //             await validateExcelContent(file);
            //             break;
            //         default:
            //             break;
            //     }
        }

        next();
    } catch (error) {
        return res.status(422).json({
            message: "Invalid file type. Only PDF, Word, and Excel files are allowed.",
            success: false,
            error: error
        });
    }
}


module.exports =
{
    validateTimesheet,
    validateDocument
};
