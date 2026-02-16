const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_rescue';

async function debug() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const now = new Date();
        console.log('Current Server Time (UTC):', now.toISOString());
        console.log('Current Server Time (Local):', now.toString());

        const donations = await mongoose.connection.collection('donations').find({}).toArray();

        console.log(`\nTotal Donations in DB: ${donations.length}`);

        for (const d of donations) {
            console.log('---');
            console.log(`ID: ${d._id}`);
            console.log(`Food: ${d.foodType}`);
            console.log(`Status: ${d.status}`);
            console.log(`Expiry: ${d.expiryTime ? d.expiryTime.toISOString() : 'N/A'}`);

            const isPosted = d.status === 'POSTED';
            const isNotExpired = d.expiryTime && new Date(d.expiryTime) > now;

            console.log(`Is POSTED? ${isPosted}`);
            console.log(`Is Valid Expiry? ${isNotExpired} (Expiry > Now)`);
            console.log(`Should show in Available? ${isPosted && isNotExpired}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
