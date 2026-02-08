const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function createCollection() {
    try {
        console.log('🔄 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const db = mongoose.connection.db;

        // Create the ragdocuments collection
        await db.createCollection('ragdocuments');
        console.log('✅ Created "ragdocuments" collection');

        console.log('\n🎉 Collection created successfully!');
        console.log('\nNext steps:');
        console.log('1. Go back to MongoDB Atlas UI');
        console.log('2. Refresh the collection list');
        console.log('3. You should now see "ragdocuments" in the list');
        console.log('4. Select it and continue with vector index creation');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        if (error.codeName === 'NamespaceExists') {
            console.log('✅ Collection "ragdocuments" already exists!');
            console.log('You can proceed with creating the vector index.');
        } else {
            console.error('❌ Error:', error.message);
        }
        await mongoose.disconnect();
        process.exit(error.codeName === 'NamespaceExists' ? 0 : 1);
    }
}

createCollection();
