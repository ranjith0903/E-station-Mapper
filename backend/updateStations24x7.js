const mongoose = require('mongoose');
const Station = require('./models/Station');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/estation-mapper', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateStationsTo24x7() {
  try {
    console.log('Updating stations to 24/7 availability...');
    
    // Update all stations to 24/7 availability
    const result = await Station.updateMany(
      {}, // Update all stations
      { 
        isAvailable24x7: true,
        availabilitySlots: [] // Clear existing slots for 24/7 stations
      }
    );
    
    console.log(`Updated ${result.modifiedCount} stations to 24/7 availability`);
    
    // Show updated stations
    const stations = await Station.find({});
    console.log('\nUpdated stations:');
    stations.forEach(station => {
      console.log(`- ${station.name}: ${station.isAvailable24x7 ? '24/7' : 'Scheduled'}`);
    });
    
  } catch (error) {
    console.error('Error updating stations:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
updateStationsTo24x7(); 