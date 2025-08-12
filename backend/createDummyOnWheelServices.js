require('dotenv').config();
const mongoose = require('mongoose');
const OnWheelService = require('./models/OnWheelService');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const dummyServices = [
  {
    companyName: "QuickCharge Mobile",
    serviceName: "24/7 Emergency Charging",
    description: "Professional mobile charging service available 24/7. Fast response time with state-of-the-art charging equipment.",
    serviceArea: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Bangalore
      radius: 25
    },
    chargingTypes: ['slow', 'fast', 'superfast'],
    plugTypes: ['Type-1', 'Type-2', 'CCS', 'CHAdeMO'],
    pricePerHour: 15,
    pricePerUnit: 2.5,
    minimumCharge: 20,
    travelFee: 5,
    maxDistance: 30,
    responseTime: 15,
    availability: {
      isAvailable24x7: true,
      workingHours: [],
      isCurrentlyAvailable: true
    },
    contactInfo: {
      phone: "+91-9876543210",
      email: "info@quickchargemobile.com",
      whatsapp: "+91-9876543210",
      website: "www.quickchargemobile.com"
    },
    vehicleInfo: {
      vehicleType: "mobile-charger-van",
      capacity: 50,
      batteryCapacity: 100
    },
    ratings: {
      averageRating: 4.5,
      totalReviews: 12,
      reviews: []
    },
    status: 'active',
    isPremium: true,
    totalServices: 45,
    totalEarnings: 1250
  },
  {
    companyName: "EV Rescue Pro",
    serviceName: "Premium Mobile Charging",
    description: "Premium mobile EV charging service with luxury vehicles and professional technicians. Available in select areas.",
    serviceArea: {
      type: 'Point',
      coordinates: [77.2090, 28.6139], // Delhi
      radius: 20
    },
    chargingTypes: ['fast', 'superfast'],
    plugTypes: ['Type-2', 'CCS'],
    pricePerHour: 25,
    pricePerUnit: 3.5,
    minimumCharge: 30,
    travelFee: 8,
    maxDistance: 25,
    responseTime: 20,
    availability: {
      isAvailable24x7: false,
      workingHours: [
        { day: 'monday', start: '08:00', end: '20:00' },
        { day: 'tuesday', start: '08:00', end: '20:00' },
        { day: 'wednesday', start: '08:00', end: '20:00' },
        { day: 'thursday', start: '08:00', end: '20:00' },
        { day: 'friday', start: '08:00', end: '20:00' },
        { day: 'saturday', start: '09:00', end: '18:00' },
        { day: 'sunday', start: '10:00', end: '16:00' }
      ],
      isCurrentlyAvailable: true
    },
    contactInfo: {
      phone: "+91-8765432109",
      email: "service@evrescuepro.com",
      whatsapp: "+91-8765432109",
      website: "www.evrescuepro.com"
    },
    vehicleInfo: {
      vehicleType: "luxury-charger-van",
      capacity: 75,
      batteryCapacity: 150
    },
    ratings: {
      averageRating: 4.8,
      totalReviews: 8,
      reviews: []
    },
    status: 'active',
    isPremium: true,
    totalServices: 23,
    totalEarnings: 890
  },
  {
    companyName: "GreenCharge Express",
    serviceName: "Eco-Friendly Mobile Charging",
    description: "Environmentally conscious mobile charging service using renewable energy sources. Fast and reliable service.",
    serviceArea: {
      type: 'Point',
      coordinates: [72.8777, 19.0760], // Mumbai
      radius: 30
    },
    chargingTypes: ['slow', 'fast'],
    plugTypes: ['Type-1', 'Type-2'],
    pricePerHour: 12,
    pricePerUnit: 2.0,
    minimumCharge: 15,
    travelFee: 3,
    maxDistance: 35,
    responseTime: 25,
    availability: {
      isAvailable24x7: true,
      workingHours: [],
      isCurrentlyAvailable: true
    },
    contactInfo: {
      phone: "+91-7654321098",
      email: "contact@greenchargeexpress.com",
      whatsapp: "+91-7654321098",
      website: "www.greenchargeexpress.com"
    },
    vehicleInfo: {
      vehicleType: "eco-charger-truck",
      capacity: 40,
      batteryCapacity: 80
    },
    ratings: {
      averageRating: 4.2,
      totalReviews: 18,
      reviews: []
    },
    status: 'active',
    isPremium: false,
    totalServices: 67,
    totalEarnings: 980
  },
  {
    companyName: "PowerOn Wheels",
    serviceName: "Budget Mobile Charging",
    description: "Affordable mobile charging service for budget-conscious EV owners. Reliable service at competitive prices.",
    serviceArea: {
      type: 'Point',
      coordinates: [73.8567, 18.5204], // Pune
      radius: 15
    },
    chargingTypes: ['slow'],
    plugTypes: ['Type-1'],
    pricePerHour: 8,
    pricePerUnit: 1.5,
    minimumCharge: 10,
    travelFee: 2,
    maxDistance: 20,
    responseTime: 30,
    availability: {
      isAvailable24x7: false,
      workingHours: [
        { day: 'monday', start: '07:00', end: '22:00' },
        { day: 'tuesday', start: '07:00', end: '22:00' },
        { day: 'wednesday', start: '07:00', end: '22:00' },
        { day: 'thursday', start: '07:00', end: '22:00' },
        { day: 'friday', start: '07:00', end: '22:00' },
        { day: 'saturday', start: '08:00', end: '20:00' },
        { day: 'sunday', start: '09:00', end: '18:00' }
      ],
      isCurrentlyAvailable: true
    },
    contactInfo: {
      phone: "+91-6543210987",
      email: "support@poweronwheels.com",
      whatsapp: "+91-6543210987",
      website: "www.poweronwheels.com"
    },
    vehicleInfo: {
      vehicleType: "compact-charger-car",
      capacity: 25,
      batteryCapacity: 50
    },
    ratings: {
      averageRating: 3.9,
      totalReviews: 25,
      reviews: []
    },
    status: 'active',
    isPremium: false,
    totalServices: 89,
    totalEarnings: 720
  },
  {
    companyName: "TechCharge Solutions",
    serviceName: "Smart Mobile Charging",
    description: "Advanced mobile charging service with smart monitoring and IoT integration. Real-time tracking and analytics.",
    serviceArea: {
      type: 'Point',
      coordinates: [78.4867, 17.3850], // Hyderabad
      radius: 22
    },
    chargingTypes: ['fast', 'superfast'],
    plugTypes: ['Type-2', 'CCS', 'CHAdeMO'],
    pricePerHour: 18,
    pricePerUnit: 2.8,
    minimumCharge: 25,
    travelFee: 6,
    maxDistance: 28,
    responseTime: 18,
    availability: {
      isAvailable24x7: true,
      workingHours: [],
      isCurrentlyAvailable: true
    },
    contactInfo: {
      phone: "+91-5432109876",
      email: "hello@techchargesolutions.com",
      whatsapp: "+91-5432109876",
      website: "www.techchargesolutions.com"
    },
    vehicleInfo: {
      vehicleType: "smart-charger-van",
      capacity: 60,
      batteryCapacity: 120
    },
    ratings: {
      averageRating: 4.6,
      totalReviews: 15,
      reviews: []
    },
    status: 'active',
    isPremium: true,
    totalServices: 34,
    totalEarnings: 1100
  }
];

async function createDummyServices() {
  try {
    // First, find or create a provider user
    let provider = await User.findOne({ role: 'onwheel-provider' });
    
    if (!provider) {
      // Create a provider user if none exists
      provider = new User({
        name: "Test Provider",
        email: "provider@test.com",
        password: "password123",
        role: "onwheel-provider",
        phone: "+91-9999999999"
      });
      await provider.save();
      console.log('Created provider user:', provider.email);
    }

    // Clear existing dummy services
    await OnWheelService.deleteMany({ provider: provider._id });
    console.log('Cleared existing dummy services');

    // Create new dummy services
    const services = [];
    for (const serviceData of dummyServices) {
      const service = new OnWheelService({
        ...serviceData,
        provider: provider._id
      });
      services.push(service);
    }

    await OnWheelService.insertMany(services);
    console.log(`Created ${services.length} dummy on-wheel services`);

    // Display created services
    const createdServices = await OnWheelService.find({ provider: provider._id })
      .populate('provider', 'name email');
    
    console.log('\nCreated Services:');
    createdServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.companyName} - ${service.serviceName}`);
      console.log(`   Location: ${service.serviceArea.coordinates[1]}, ${service.serviceArea.coordinates[0]}`);
      console.log(`   Price: $${service.pricePerHour}/hour`);
      console.log(`   Rating: ${service.ratings.averageRating}/5 (${service.ratings.totalReviews} reviews)`);
      console.log('');
    });

  } catch (error) {
    console.error('Error creating dummy services:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createDummyServices();
