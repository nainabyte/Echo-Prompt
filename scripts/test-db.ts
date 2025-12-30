
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

console.log('🔄 Attempting to connect to MongoDB...');
// console.log('URI:', MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@')); // Mask password

async function testConnection() {
    try {
        await mongoose.connect(MONGODB_URI!, {
            serverSelectionTimeoutMS: 5000, 
        });
        console.log('✅ MongoDB Connection Successful!');
        console.log('Connection State:', mongoose.connection.readyState);
        await mongoose.disconnect();
    } catch (error: any) {
        console.error('❌ MongoDB Connection Failed:');
        console.error(error.message);
        if (error.name === 'MongooseServerSelectionError') {
             console.error('\nPossible Causes:');
             console.error('1. IP Address not whitelisted in MongoDB Atlas.');
             console.error('2. Incorrect credentials.');
             console.error('3. Firewall blocking connection.');
        }
    }
}

testConnection();
