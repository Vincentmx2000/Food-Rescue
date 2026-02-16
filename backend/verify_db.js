const mongoose = require('mongoose');
require('dotenv').config();

async function v() {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    process.exit(0);
}
v();
