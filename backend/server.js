require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Debug: Check if environment variables are loaded
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
console.log('JWT Secret:', process.env.JWT_SECRET ? 'Found' : 'Not found');
console.log('Stripe Secret:', process.env.STRIPE_SECRET_KEY ? 'Found' : 'Not found');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/onwheel-services', require('./routes/onwheel-services'));
app.use('/api/onwheel-requests', require('./routes/onwheel-requests'));
app.use('/api/onwheel-payment', require('./routes/onwheel-payment'));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err)); 