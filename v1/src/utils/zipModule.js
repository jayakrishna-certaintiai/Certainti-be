const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const packageAsZip = async (filePaths) => {
    return new Promise((resolve, reject) => {
        const zipFileName = path.join(__dirname, 'TechnicalSummaries.zip');
        const output = fs.createWriteStream(zipFileName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`ZIP file has been created: ${zipFileName}`);
            resolve(zipFileName); // Resolve the path of the created ZIP file
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        // Append all files to the archive
        filePaths.forEach((filePath) => {
            archive.file(filePath, { name: path.basename(filePath) });
        });

        archive.finalize();
    });
};

module.exports = { packageAsZip }