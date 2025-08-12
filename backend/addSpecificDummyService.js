require('dotenv').config();
const mongoose = require('mongoose');
const OnWheelService = require('./models/OnWheelService');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const newService = {
  companyName: "Mysore Mobile Charging",
  serviceName: "Premium On-Wheel Charging Service",
  description: "Professional mobile charging service in Mysore area. Fast response time with modern charging equipment and experienced technicians. Available 24/7 for emergency situations.",
  serviceArea: {
    type: 'Point',
    coordinates: [76.585330, 12.372319], // User's specific coordinates
    radius: 20
  },
  chargingTypes: ['slow', 'fast', 'superfast'],
  plugTypes: ['Type-1', 'Type-2', 'CCS', 'CHAdeMO'],
  pricePerHour: 18,
  pricePerUnit: 2.8,
  minimumCharge: 25,
  travelFee: 6,
  maxDistance: 25,
  responseTime: 20,
  availability: {
    isAvailable24x7: true,
    workingHours: [],
    isCurrentlyAvailable: true
  },
  contactInfo: {
    phone: "+91-9876543211",
    email: "service@mysoremobilecharging.com",
    whatsapp: "+91-9876543211",
    website: "www.mysoremobilecharging.com"
  },
  vehicleInfo: {
    vehicleType: "premium-charger-van",
    capacity: 60,
    batteryCapacity: 120
  },
  ratings: {
    averageRating: 4.7,
    totalReviews: 15,
    reviews: []
  },
  status: 'active',
  isPremium: true,
  totalServices: 38,
  totalEarnings: 950
};

async function addSpecificDummyService() {
  try {
    // First, find or create a provider user
    let provider = await User.findOne({ role: 'onwheel-provider' });
    
    if (!provider) {
      // Create a provider user if none exists
      provider = new User({
        name: "Mysore Provider",
        email: "mysore@test.com",
        password: "password123",
        role: "onwheel-provider",
        phone: "+91-9876543211"
      });
      await provider.save();
      console.log('Created provider user:', provider.email);
    }

    // Create the new service
    const service = new OnWheelService({
      ...newService,
      provider: provider._id
    });

    await service.save();
    console.log('✅ Successfully created new on-wheel service!');
    console.log('\n📋 Service Details:');
    console.log(`   Company: ${service.companyName}`);
    console.log(`   Service: ${service.serviceName}`);
    console.log(`   Location: ${service.serviceArea.coordinates[1]}, ${service.serviceArea.coordinates[0]}`);
    console.log(`   Price: $${service.pricePerHour}/hour`);
    console.log(`   Rating: ${service.ratings.averageRating}/5 (${service.ratings.totalReviews} reviews)`);
    console.log(`   Service Area: ${service.serviceArea.radius}km radius`);
    console.log(`   Response Time: ${service.responseTime} minutes`);
    console.log(`   Max Distance: ${service.maxDistance}km`);
    console.log(`   Travel Fee: $${service.travelFee}`);
    console.log(`   Minimum Charge: $${service.minimumCharge}`);

    console.log('\n🔌 Available Charging Types:');
    service.chargingTypes.forEach(type => {
      console.log(`   - ${type}`);
    });

    console.log('\n🔌 Available Plug Types:');
    service.plugTypes.forEach(type => {
      console.log(`   - ${type}`);
    });

    console.log('\n📞 Contact Information:');
    console.log(`   Phone: ${service.contactInfo.phone}`);
    console.log(`   Email: ${service.contactInfo.email}`);
    console.log(`   WhatsApp: ${service.contactInfo.whatsapp}`);

    console.log('\n🚗 Vehicle Information:');
    console.log(`   Type: ${service.vehicleInfo.vehicleType}`);
    console.log(`   Capacity: ${service.vehicleInfo.capacity}kW`);
    console.log(`   Battery: ${service.vehicleInfo.batteryCapacity}kWh`);

    console.log('\n✅ Service is now available for booking!');

  } catch (error) {
    console.error('❌ Error creating service:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addSpecificDummyService();
