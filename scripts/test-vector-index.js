const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function test() {
    try {
        console.log('🔄 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const db = mongoose.connection.db;

        // List all search indexes
        const indexes = await db.collection('ragdocuments')
            .listSearchIndexes()
            .toArray();

        console.log('\n📋 Search Indexes:');
        if (indexes.length === 0) {
            console.log('   No search indexes found');
            console.log('   ⚠️  Create vector_index in Atlas UI');
        } else {
            indexes.forEach(idx => {
                const statusIcon = idx.status === 'READY' ? '🟢' : '🟡';
                console.log(`   ${statusIcon} ${idx.name} (${idx.status})`);
            });
        }

        // Check for vector_index specifically
        const vectorIndex = indexes.find(idx => idx.name === 'vector_index');

        console.log('\n🔍 Vector Index Status:');
        if (vectorIndex) {
            console.log(`   ✅ Found: vector_index`);
            console.log(`   Status: ${vectorIndex.status}`);
            console.log(`   Type: ${vectorIndex.type}`);

            if (vectorIndex.status === 'READY') {
                console.log('\n   🎉 Vector search is ready to use!');
            } else if (vectorIndex.status === 'BUILDING') {
                console.log('\n   ⏳ Index is building, wait 1-2 minutes...');
            } else {
                console.log(`\n   ⚠️  Unexpected status: ${vectorIndex.status}`);
            }
        } else {
            console.log('   ❌ vector_index not found');
            console.log('\n   📝 To create it:');
            console.log('   1. Go to MongoDB Atlas → Search tab');
            console.log('   2. Create Search Index on ragdocuments collection');
            console.log('   3. Use JSON Editor with the config from mongodb_vector_setup.md');
        }

        // Check collection exists
        const collections = await db.listCollections({ name: 'ragdocuments' }).toArray();
        console.log('\n📦 Collection Status:');
        if (collections.length > 0) {
            const stats = await db.collection('ragdocuments').stats();
            console.log(`   ✅ ragdocuments collection exists`);
            console.log(`   Documents: ${stats.count}`);
        } else {
            console.log('   ⚠️  ragdocuments collection not created yet');
            console.log('   (Will be created on first document upload)');
        }

        console.log('\n✨ Test complete!');
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check MONGODB_URI in .env.local');
        console.log('2. Ensure MongoDB Atlas is accessible');
        console.log('3. Verify network connection');
        await mongoose.disconnect();
        process.exit(1);
    }
}

test();
