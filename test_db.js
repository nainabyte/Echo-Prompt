const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load env simply
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const uriLine = envContent.split('\n').find(line => line.startsWith('MONGODB_URI='));
const uri = uriLine ? uriLine.split('=')[1].trim().replace(/['"]/g, '') : null;

if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
}

console.log("Attempting to connect to MongoDB...");
// Mask URI for safety in logs
console.log("URI:", uri.substring(0, 15) + "...");

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000, // Fail fast (5s instead of 30s)
})
    .then(() => {
        console.log("SUCCESS: Database connected successfully!");
        process.exit(0);
    })
    .catch(err => {
        console.error("CONNECTION FAILED:");
        console.dir(err, { depth: null });
        process.exit(1);
    });
