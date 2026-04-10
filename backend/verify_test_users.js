const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/food_rescue';

async function verifyUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            isVerified: Boolean,
            role: String
        }));

        // Verify the Test NGO
        const ngo = await User.findOneAndUpdate(
            { email: 'ngo_test@example.com' },
            { isVerified: true },
            { new: true }
        );
        
        if (ngo) {
            console.log('Test NGO verified:', ngo.email);
        } else {
            console.log('Test NGO not found');
        }

        // Create an Admin user if not exists
        const adminEmail = 'admin_test@example.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            // We need bcrypt to hash password if we were creating from scratch, 
            // but for testing role access, we can register via UI if we want.
            // Actually, let's just update a user to ADMIN role.
            console.log('To test Admin, register a user and run this script to change their role to ADMIN.');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

verifyUsers();
