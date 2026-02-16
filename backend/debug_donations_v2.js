const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_rescue';

async function run() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        // Access native driver collection to see raw data without schema casting if possible, 
        // but Mongoose models are also fine if we used them. I'll use native collection to be sure.
        const db = mongoose.connection.db;
        const collection = db.collection('donations');

        const count = await collection.countDocuments({});
        console.log(`Total Donations: ${count}`);

        const all = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray();

        const now = new Date();
        console.log(`Server Time (UTC): ${now.toISOString()}`);
        console.log(`Server Time (Local): ${now.toString()}`);

        console.log('\n--- Recent Donations ---');
        for (const d of all) {
            console.log(`ID: ${d._id}`);
            console.log(`Food: ${d.foodType}`);
            console.log(`Status: '${d.status}'`);
            console.log(`Expiry (Raw):`, d.expiryTime);
            console.log(`Expiry Type:`, Object.prototype.toString.call(d.expiryTime));

            let expiryDate;
            if (d.expiryTime instanceof Date) {
                expiryDate = d.expiryTime;
            } else {
                expiryDate = new Date(d.expiryTime);
            }

            const isValidDate = !isNaN(expiryDate.getTime());
            console.log(`Expiry (ISO): ${isValidDate ? expiryDate.toISOString() : 'Invalid Date'}`);

            if (isValidDate) {
                console.log(`Is Expired? ${expiryDate <= now} (Expiry <= Now)`);
                console.log(`Should show (Status='POSTED' & !Expired)? ${d.status === 'POSTED' && expiryDate > now}`);
            }
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
