require('dotenv').config();
const mongoose = require('mongoose');
const OnWheelService = require('./models/OnWheelService');
const OnWheelRequest = require('./models/OnWheelRequest');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testOnWheelAPI() {
  try {
    console.log('🧪 Testing On-Wheel API...\n');

    // Test 1: Check if services exist
    const services = await OnWheelService.find().populate('provider', 'name email');
    console.log(`✅ Found ${services.length} on-wheel services`);
    
    if (services.length > 0) {
      console.log('\n📋 Available Services:');
      services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.companyName} - ${service.serviceName}`);
        console.log(`   Location: ${service.serviceArea.coordinates[1]}, ${service.serviceArea.coordinates[0]}`);
        console.log(`   Price: $${service.pricePerHour}/hour`);
        console.log(`   Status: ${service.status}`);
        console.log(`   Available: ${service.availability.isCurrentlyAvailable}`);
        console.log('');
      });
    }

    // Test 2: Check if provider users exist
    const providers = await User.find({ role: 'onwheel-provider' });
    console.log(`✅ Found ${providers.length} provider users`);

    // Test 3: Test distance calculation
    if (services.length > 0) {
      const service = services[0];
      const testLocation = {
        lat: 12.372319,
        lng: 76.585330
      };
      
      try {
        const distance = service.calculateDistance(
          service.serviceArea.coordinates[1], // lat
          service.serviceArea.coordinates[0], // lng
          testLocation.lat,
          testLocation.lng
        );
        console.log(`✅ Distance calculation works: ${distance.toFixed(2)}km`);
      } catch (error) {
        console.log(`❌ Distance calculation failed: ${error.message}`);
      }
    }

    // Test 4: Check OnWheelRequest model
    const requests = await OnWheelRequest.find().populate('service', 'companyName');
    console.log(`✅ Found ${requests.length} on-wheel requests`);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testOnWheelAPI();
