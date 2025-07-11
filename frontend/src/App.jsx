import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MapPin, User, Plus, LogOut, Zap, Home, Settings, Calendar, Shield } from 'lucide-react';
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

function Navigation({ auth, setAuth }) {
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(null);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">E-Station</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <Link 
                  to="/profile" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/profile' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        ? 'bg-primary-100 text-primary-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Station</span>
                  </Link>
                )}
                
                {auth.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/admin' 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        ? 'bg-primary-100 text-primary-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>EV Trip Planner</span>
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
                  className="btn-secondary"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary"
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<MapView />} />
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
