const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('[MongoDB] MONGODB_URI is not set.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected successfully.');
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
