const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_rescue';

async function run() {
    try {
        await mongoose.connect(uri);

        const db = mongoose.connection.db;
        const collection = db.collection('donations');

        // Get the SINGLE most recent donation
        const latest = await collection.find({}).sort({ _id: -1 }).limit(1).toArray();

        if (latest.length === 0) {
            console.log("No donations found.");
            return;
        }

        const d = latest[0];
        const now = new Date();

        console.log("--- LATEST DONATION DEBUG ---");
        console.log(`ID: ${d._id}`);
        console.log(`Created At: ${d.createdAt}`);
        console.log(`Status: '${d.status}'`);
        console.log(`Your 'expiryTime' (Raw):`, d.expiryTime);

        let expiryDate = new Date(d.expiryTime);
        console.log(`Expiry Parsed (Local): ${expiryDate.toString()}`);
        console.log(`Expiry Parsed (ISO): ${expiryDate.toISOString()}`);
        console.log(`Current Server Time: ${now.toString()}`);

        const isExpired = expiryDate <= now;
        console.log(`Is Expired? ${isExpired} (Expiry <= Now)`);
        console.log(`Is Status POSTED? ${d.status === 'POSTED'}`);

        console.log(`VISIBLE IN API? ${!isExpired && d.status === 'POSTED'}`);
        console.log("-----------------------------");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
