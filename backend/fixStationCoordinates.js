const mongoose = require('mongoose');
const Station = require('./models/Station');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/estation';

async function fixStationCoordinates() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Fix Bangalore station coordinates
    const bangaloreStation = await Station.findOne({ name: 'Bangalore EV Supercharge' });
    if (bangaloreStation) {
      bangaloreStation.location.coordinates = [77.5946, 12.9716]; // Fix latitude from 9.971600 to 12.971600
      await bangaloreStation.save();
      console.log('Fixed Bangalore station coordinates');
    }

    // Verify all stations have correct coordinates
    const stations = await Station.find({});
    console.log('\nAll stations with coordinates:');
    stations.forEach(station => {
      console.log(`${station.name}: [${station.location.coordinates[0]}, ${station.location.coordinates[1]}]`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error fixing coordinates:', err);
    process.exit(1);
  }
}

fixStationCoordinates(); 