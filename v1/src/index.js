require('dotenv').config();
const { app } = require('./setups/server/app');

const fs = require('fs');

// Add error handling to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Keep the server running
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Keep the server running
});

app.listen(process.env.PORT || 8081, () => {
    console.log(`Server is running at port : ${process.env.PORT}`);
});


// require('dotenv').config();
// const fs = require('fs');
// const path = require('path');
// const spdy = require('spdy');
// const { app } = require('./setups/server/app');


// const keyPath = path.resolve(__dirname, process.env.KEY_PATH);
// const certPath = path.resolve(__dirname, process.env.CERT_PATH);

// console.error("path " + keyPath);

// const options = {
//     key: fs.readFileSync(keyPath),
//     cert: fs.readFileSync(certPath)
// };
// const server = spdy.createServer(options, app);

// const PORT = process.env.PORT || 8081;

// server.listen(PORT, (err) => {
//     if (err) {
//         throw new Error(err);
//     }
//     console.log(`Server is running on https://localhost:${PORT}`);

// });