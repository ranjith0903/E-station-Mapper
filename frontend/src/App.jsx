import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MapPin, User, Plus, LogOut, Zap, Home, Settings, Calendar, Shield, Truck } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import MapView from './pages/MapView';
import StationRegister from './pages/StationRegister';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import AdminPanel from './pages/AdminPanel';
import MyStations from './pages/MyStations';
import EVTripPlanner from './pages/EVTripPlanner';
import OnWheelServices from './pages/OnWheelServices';
import OnWheelServiceRegister from './pages/OnWheelServiceRegister';
import RequestOnWheelService from './pages/RequestOnWheelService';

function Navigation({ auth, setAuth }) {
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(null);
  };

  // Don't show navigation on landing page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/map" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">E-Station</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/map" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/map' 
                  ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Map</span>
            </Link>
            
            {auth ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard' 
                      ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <Link 
                  to="/profile" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/profile' 
                      ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                
                {auth.role === 'owner' && (
                  <Link 
                    to="/station/register" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/station/register' 
                        ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Station</span>
                  </Link>
                )}
                
                {auth.role === 'onwheel-provider' && (
                  <Link 
                    to="/onwheel-service/register" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/onwheel-service/register' 
                        ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span>Register Service</span>
                  </Link>
                )}
                
                {auth.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/admin' 
                        ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                
                <Link 
                  to="/my-bookings" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/my-bookings' 
                      ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>My Bookings</span>
                </Link>
                
                {auth.role === 'owner' && (
                  <Link 
                    to="/my-stations" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/my-stations' 
                        ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span>My Stations</span>
                  </Link>
                )}
                
                <Link 
                  to="/trip-planner" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/trip-planner' 
                      ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>EV Trip Planner</span>
                </Link>
                
                <Link 
                  to="/onwheel-services" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/onwheel-services' 
                      ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  <span>On-Wheel Services</span>
                </Link>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Hi, {auth.name}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You could verify the token here if needed
      // For now, we'll just set a basic auth state
      setAuth({ name: 'User', role: 'user' });
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation auth={auth} setAuth={setAuth} />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/login" element={<Login setAuth={setAuth} />} />
            <Route path="/register" element={<Register setAuth={setAuth} />} />
            <Route path="/station/register" element={<StationRegister />} />
            <Route path="/booking/:stationId/:amount" element={<Booking />} />
            <Route path="/dashboard" element={<Dashboard auth={auth} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/my-stations" element={<MyStations />} />
            <Route path="/trip-planner" element={<EVTripPlanner />} />
            <Route path="/onwheel-services" element={<OnWheelServices />} />
            <Route path="/onwheel-service/register" element={<OnWheelServiceRegister />} />
            <Route path="/request-onwheel-service" element={<RequestOnWheelService />} />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}
