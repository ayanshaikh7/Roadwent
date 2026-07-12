import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const Navbar = () => {
  const auth = useAuth();
  const { isAuthenticated, user, logout } = auth || { isAuthenticated: false, user: null, logout: () => {} };
  const navigate = useNavigate();
  
  const activeLinkStyle = {
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    fontWeight: '600',
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
    navigate('/', { state: { toast: 'Logged out' } });
  };

  return (
    <nav className="bg-white text-gray-800 p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold tracking-wider text-blue-600 flex items-center space-x-2">
          <img src="/roadwent.ico.png" alt="RoadWent Logo" className="w-8 h-8" />
          <span>RoadWent.com</span>
        </NavLink>
        <div className="hidden md:flex items-center space-x-2 font-medium">
          <NavLink to="/project-details" className="px-3 py-2 rounded-md hover:bg-gray-100" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>Estimator</NavLink>
          <NavLink to="/report" className="px-3 py-2 rounded-md hover:bg-gray-100" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>Report</NavLink>
          <NavLink to="/help" className="px-3 py-2 rounded-md hover:bg-gray-100" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>Help</NavLink>
          <NavLink to="/contact" className="px-3 py-2 rounded-md hover:bg-gray-100" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>Contact</NavLink>
        </div>
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-gray-700 font-medium">Hello, {user?.name || 'User'}</span>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="px-4 py-2 rounded-full hover:bg-gray-100 font-semibold">Login</NavLink>
              <NavLink to="/signup" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300">Sign Up</NavLink>
              {/** Build OAuth link from environment for hosting */}
              <a
                href={`${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/auth/google`}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300"
              >
                Login with Google
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;