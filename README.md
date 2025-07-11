# ⚡ E-Station Mapper

A modern, full-stack application for finding and booking electric vehicle charging stations. Built with React, Node.js, MongoDB, and Stripe for seamless payment processing.

## 🌟 Features

### For EV Users
- **Interactive Map View**: Find nearby charging stations using OpenStreetMap
- **Advanced Filtering**: Filter by charging type, price, plug type, and distance
- **Real-time Booking**: Book charging slots with instant payment via Stripe
- **Booking History**: View all your past and upcoming bookings
- **Location Detection**: Automatic GPS location detection

### For Station Owners
- **Station Registration**: Add your charging stations with detailed information
- **Map-based Location Picker**: Precisely set your station location
- **Earnings Dashboard**: Track your revenue and booking statistics
- **Station Management**: View and manage all your registered stations

### Technical Features
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Real-time Notifications**: Toast notifications for user feedback
- **Secure Authentication**: JWT-based authentication with role-based access
- **Payment Integration**: Stripe payment processing for bookings
- **Geospatial Queries**: MongoDB GeoJSON for location-based searches

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd estation-mapper
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   ```

4. **Environment Setup**

   Create `.env` file in the `backend` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

   Update Stripe publishable key in `frontend/src/pages/Booking.jsx`:
   ```javascript
   const stripePromise = loadStripe('your_stripe_publishable_key');
   ```

5. **Start the servers**

   Backend (from `backend` directory):
   ```bash
   npm start
   ```

   Frontend (from `frontend` directory):
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
estation-mapper/
├── backend/
│   ├── models/
│   │   ├── User.js          # User model with roles
│   │   ├── Station.js       # Station model with GeoJSON
│   │   └── Booking.js       # Booking model
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── stations.js      # Station management routes
│   │   ├── bookings.js      # Booking routes
│   │   └── payment.js       # Stripe payment routes
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   └── server.js            # Express server setup
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx        # User authentication
│   │   │   ├── Register.jsx     # User registration
│   │   │   ├── MapView.jsx      # Interactive map with stations
│   │   │   ├── StationRegister.jsx  # Station registration form
│   │   │   ├── Booking.jsx      # Booking and payment
│   │   │   └── Dashboard.jsx    # User dashboard
│   │   ├── App.jsx              # Main app with routing
│   │   └── index.css            # Tailwind CSS styles
│   ├── tailwind.config.js       # Tailwind configuration
│   └── postcss.config.js        # PostCSS configuration
└── README.md
```

## 🔧 Configuration

### MongoDB Setup
1. Create a MongoDB database (local or MongoDB Atlas)
2. Update `MONGO_URI` in backend `.env` file
3. The application will automatically create collections and indexes

### Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe dashboard
3. Update both secret and publishable keys in the configuration

### Environment Variables

**Backend (.env)**
```env
MONGO_URI=mongodb://localhost:27017/estation-mapper
JWT_SECRET=your_super_secret_jwt_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PORT=5000
```

**Frontend (Booking.jsx)**
```javascript
const stripePromise = loadStripe('pk_test_your_stripe_publishable_key');
```

## 🎯 Usage Guide

### For EV Users
1. **Register/Login**: Create an account or sign in
2. **Find Stations**: Use the map to find nearby charging stations
3. **Filter Options**: Use filters to find specific types of stations
4. **Book a Slot**: Click "Book Now" on any station
5. **Complete Payment**: Enter card details and confirm booking
6. **View Bookings**: Check your dashboard for booking history

### For Station Owners
1. **Register as Owner**: Create an account with "Station Owner" role
2. **Add Stations**: Use the "Add Station" form to register your charging stations
3. **Set Location**: Click on the map to set precise station location
4. **Configure Details**: Set charging types, plug types, pricing, and availability
5. **Monitor Earnings**: View your dashboard for booking statistics and earnings

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Stations
- `POST /api/stations/register` - Register new station (owner only)
- `GET /api/stations/nearby` - Get nearby stations
- `GET /api/stations/:id` - Get station by ID
- `GET /api/stations/my-stations` - Get owner's stations

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user's bookings

### Payments
- `POST /api/payment/create-payment-intent` - Create Stripe payment intent

## 🎨 UI Components

The application uses a modern design system with:
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **React Leaflet** for maps
- **Stripe Elements** for payment forms

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permissions for users and owners
- **Input Validation**: Form validation on both frontend and backend
- **Secure Payments**: Stripe integration for safe payment processing
- **Environment Variables**: Sensitive data stored in environment variables

## 🚀 Deployment

### Backend Deployment
1. **Render/Heroku**: Upload backend folder and set environment variables
2. **Vercel**: Deploy as Node.js API
3. **AWS/DigitalOcean**: Deploy to cloud server

### Frontend Deployment
1. **Vercel**: Connect GitHub repository and deploy
2. **Netlify**: Upload build folder or connect repository
3. **AWS S3**: Upload static files to S3 bucket

### Database
- **MongoDB Atlas**: Cloud-hosted MongoDB database
- **Local MongoDB**: Self-hosted database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔮 Future Enhancements

- [ ] Real-time station availability updates
- [ ] Push notifications for booking status
- [ ] Rating and review system
- [ ] Subscription plans for frequent users
- [ ] Mobile app development
- [ ] IoT integration for automatic station control
- [ ] Route planning with charging stops
- [ ] Admin panel for platform management

---

**Built with ❤️ for the EV community** 