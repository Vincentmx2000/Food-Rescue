const mongoose = require('mongoose');
require('dotenv').config();

const donationSchema = new mongoose.Schema({
    donorId: mongoose.Schema.Types.ObjectId,
    foodType: String,
    quantity: Number,
    unit: String,
    expiryTime: Date,
    address: String,
    status: String,
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    }
}, { collection: 'donations' });

const Donation = mongoose.model('Donation', donationSchema);

async function create() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        // Find a donor to use
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const donor = await User.findOne({ role: 'DONOR' });

        if (!donor) {
            console.log('No donor found to link donation to');
            process.exit(1);
        }

        const donation = await Donation.create({
            donorId: donor._id,
            foodType: 'Test Food ' + Date.now(),
            quantity: 5,
            unit: 'kg',
            expiryTime: new Date(Date.now() + 86400000),
            address: '123 Test St',
            status: 'AVAILABLE',
            location: {
                type: 'Point',
                coordinates: [77.5946, 12.9716]
            }
        });

        console.log('Created donation:', donation._id, 'Status:', donation.status);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

create();
