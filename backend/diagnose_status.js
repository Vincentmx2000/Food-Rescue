const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_rescue';

async function run() {
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;

        console.log('\n--- Volunteer Tasks ---');
        const tasks = await db.collection('volunteertasks').find({}).toArray();
        for (const t of tasks) {
            console.log(`Task ID: ${t._id}`);
            console.log(`  Donation: ${t.donationId}`);
            console.log(`  Volunteer: ${t.volunteerId}`);
            console.log(`  Status: ${t.status}`);
            console.log('------------------------');
        }

        console.log('\n--- Donations ---');
        const donations = await db.collection('donations').find({}).toArray();
        for (const d of donations) {
            console.log(`Donation ID: ${d._id}`);
            console.log(`  Status: ${d.status}`);
            console.log(`  Assigned Volunteer: ${d.assignedVolunteer}`);
            console.log('------------------------');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
