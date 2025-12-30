const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
let uri = null;

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const uriLine = envContent.split('\n').find(line => line.trim().startsWith('MONGODB_URI='));
    if (uriLine) {
        uri = uriLine.split('=')[1].trim().replace(/['"]/g, '');
    }
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
}

// Mask credentials for log
const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(`Connecting to: ${maskedUri}`);

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
})
    .then(() => {
        console.log("SUCCESS: Connected!");
        process.exit(0);
    })
    .catch(err => {
        console.log("CONNECTION ERROR:");
        console.log("Name:", err.name);
        console.log("Message:", err.message);
        if (err.reason) console.log("Reason:", err.reason);
        if (err.code) console.log("Code:", err.code);
        process.exit(1);
    });
