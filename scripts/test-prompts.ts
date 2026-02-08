import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import PromptHistory from '../models/PromptHistory';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
}

async function testPromptHistory() {
    console.log('🔄 Connecting to DB...');
    await mongoose.connect(MONGODB_URI!);

    try {
        // 1. Create
        console.log('📝 Creating new Prompt History...');
        // Mock User ID (make sure this is valid or create a temp one if needed, but for schema test ObjectId is enough)
        const userId = new mongoose.Types.ObjectId();

        const newPrompt = await PromptHistory.create({
            user: userId,
            title: "Test Prompt Integration",
            originalPrompt: "Write a poem about code",
            versions: [{
                label: "v1",
                content: "Write a poem about code",
                timestamp: new Date()
            }]
        });
        console.log('✅ Created:', newPrompt._id);

        // 2. Add Version
        console.log('🔄 Adding new version...');
        newPrompt.versions.push({
            label: "v2",
            content: "Write a haiku about code",
            timestamp: new Date()
        });
        await newPrompt.save();
        console.log('✅ Version added. Total versions:', newPrompt.versions.length);

        // 3. Add Response
        console.log('Adding response...');
        newPrompt.responses.push({
            model: "gpt-4",
            text: "Code flows like water...",
            cost: 0.002,
            duration: 500
        });
        await newPrompt.save();
        console.log('✅ Response added.');

        // 4. Clean up
        console.log('🗑️ Cleaning up...');
        await PromptHistory.findByIdAndDelete(newPrompt._id);
        console.log('✅ Deleted test prompt.');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testPromptHistory();
