const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Station = require('./models/Station');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/estation-mapper', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createTestWaitTimeBooking() {
  try {
    console.log('Creating test booking for wait time demonstration...');
    
    // Find a station
    const station = await Station.findOne();
    if (!station) {
      console.log('No stations found. Please create a station first.');
      return;
    }
    
    // Find a user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    // Create a confirmed booking that starts in 15 minutes
    const now = new Date();
    const startTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const booking = new Booking({
      user: user._id,
      station: station._id,
      slot: {
        start: startTime,
        end: endTime
      },
      status: 'confirmed', // This will show waiting time for others
      amount: station.price * 2 // 2 hours
    });
    
    await booking.save();
    console.log('✅ Test booking created successfully!');
    console.log('📍 Station ID:', station._id);
    console.log('📅 Booking starts in: 15 minutes');
    console.log('⏱️  Duration: 2 hours');
    console.log('🕐 End time:', endTime.toLocaleString());
    console.log('⏳ Others will see: "Wait: 2h 15m"');
    console.log('');
    console.log('Now check the frontend - you should see waiting time displayed!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test booking:', error);
    mongoose.connection.close();
  }
}

createTestWaitTimeBooking(); 