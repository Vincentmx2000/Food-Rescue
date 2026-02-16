const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_rescue';

async function run() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Migrate POSTED -> AVAILABLE
        const res1 = await mongoose.connection.collection('donations').updateMany(
            { status: 'POSTED' },
            { $set: { status: 'AVAILABLE' } }
        );
        console.log(`Updated POSTED -> AVAILABLE: ${res1.modifiedCount}`);

        // Migrate CLAIMED -> CLAIMED_BY_NGO
        const res2 = await mongoose.connection.collection('donations').updateMany(
            { status: 'CLAIMED' },
            { $set: { status: 'CLAIMED_BY_NGO' } }
        );
        console.log(`Updated CLAIMED -> CLAIMED_BY_NGO: ${res2.modifiedCount}`);

        // Migrate ASSIGNED -> VOLUNTEER_ASSIGNED
        const res3 = await mongoose.connection.collection('donations').updateMany(
            { status: 'ASSIGNED' },
            { $set: { status: 'VOLUNTEER_ASSIGNED' } }
        );
        console.log(`Updated ASSIGNED -> VOLUNTEER_ASSIGNED: ${res3.modifiedCount}`);

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
