const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Station = require('./models/Station');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/estation-mapper', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createTestBooking() {
  try {
    console.log('Creating test booking...');
    
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
    
    // Create a booking that starts now and ends in 2 hours
    const now = new Date();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    const booking = new Booking({
      user: user._id,
      station: station._id,
      slot: {
        start: now,
        end: endTime
      },
      status: 'ongoing', // This will show waiting time
      actualStart: now,
      amount: station.price * 2 // 2 hours
    });
    
    await booking.save();
    console.log('Test booking created successfully!');
    console.log('Station ID:', station._id);
    console.log('Booking ID:', booking._id);
    console.log('Status: ongoing');
    console.log('End time:', endTime);
    console.log('Estimated wait time: 120 minutes');
    
    // Also create a confirmed booking that starts in 30 minutes
    const futureStart = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const futureEnd = new Date(futureStart.getTime() + 1 * 60 * 60 * 1000); // 1 hour duration
    
    const futureBooking = new Booking({
      user: user._id,
      station: station._id,
      slot: {
        start: futureStart,
        end: futureEnd
      },
      status: 'confirmed', // This will also show waiting time
      amount: station.price
    });
    
    await futureBooking.save();
    console.log('Future booking created successfully!');
    console.log('Future booking starts in 30 minutes');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test booking:', error);
    mongoose.connection.close();
  }
}

createTestBooking(); 