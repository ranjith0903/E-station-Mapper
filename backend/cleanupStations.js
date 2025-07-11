const mongoose = require('mongoose');
const Station = require('./models/Station');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/estation';

async function cleanupStations() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Remove invalid stations
    const result = await Station.deleteMany({
      $or: [
        { location: { $exists: false } },
        { location: null },
        { 'location.type': { $ne: 'Point' } },
        { 'location.coordinates': { $not: { $size: 2 } } }
      ]
    });
    console.log(`Removed ${result.deletedCount} invalid stations.`);

    // Ensure 2dsphere index
    await Station.collection.createIndex({ location: '2dsphere' });
    console.log('Ensured 2dsphere index on location.');

    process.exit(0);
  } catch (err) {
    console.error('Cleanup error:', err);
    process.exit(1);
  }
}

cleanupStations(); 