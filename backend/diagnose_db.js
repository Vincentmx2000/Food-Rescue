const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_rescue';

async function run() {
    let output = '';
    const log = (msg) => {
        output += msg + '\n';
        console.log(msg);
    };

    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;

        log('\n--- Volunteer Tasks ---');
        const tasks = await db.collection('volunteertasks').find({}).toArray();
        for (const t of tasks) {
            log(`Task ID: ${t._id}`);
            log(`  Donation: ${t.donationId}`);
            log(`  Volunteer: ${t.volunteerId}`);
            log(`  Status: ${t.status}`);
            log('------------------------');
        }

        log('\n--- Donations ---');
        const donations = await db.collection('donations').find({}).toArray();
        for (const d of donations) {
            log(`Donation ID: ${d._id}`);
            log(`  Status: ${d.status}`);
            log(`  Assigned Volunteer: ${d.assignedVolunteer}`);
            log('------------------------');
        }

        log('\n--- Users ---');
        const users = await db.collection('users').find({}).toArray();
        for (const u of users) {
            log(`User ID: ${u._id} Name: ${u.name} Role: ${u.role}`);
        }

        fs.writeFileSync('diagnostics.txt', output);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
