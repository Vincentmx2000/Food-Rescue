const mongoose = require('mongoose');
require('dotenv').config();

const donationSchema = new mongoose.Schema({}, { strict: false, collection: 'donations' });
const Donation = mongoose.model('Donation', donationSchema);

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Fix status values
        const res = await Donation.updateMany(
            { status: { $in: ['POSTED', 'posted', 'pending', 'PENDING', null, ''] } },
            { $set: { status: 'AVAILABLE' } }
        );
        console.log('Legacy statuses updated:', res.modifiedCount);

        const res2 = await Donation.updateMany(
            { status: { $in: ['CLAIMED', 'claimed'] } },
            { $set: { status: 'CLAIMED_BY_NGO' } }
        );
        console.log('Claimed statuses updated:', res2.modifiedCount);

        const res3 = await Donation.updateMany(
            { status: { $in: ['ASSIGNED', 'assigned'] } },
            { $set: { status: 'VOLUNTEER_ASSIGNED' } }
        );
        console.log('Assigned statuses updated:', res3.modifiedCount);

        // Verify final counts
        const all = await Donation.find({});
        const counts = {};
        all.forEach(d => {
            const s = d.status || 'UNDEFINED';
            counts[s] = (counts[s] || 0) + 1;
        });
        console.log('Final counts:', counts);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
