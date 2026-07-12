import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      setLoading(false);
      
      if (result.success) {
        // Redirect to home page after successful login with toast
        navigate('/', { state: { toast: 'Login successfully' } });
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-2xl border border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/roadwent.ico.png" alt="RoadWent Logo" className="w-12 h-12" />
            <h1 className="text-2xl font-bold text-blue-600">RoadWent.com</h1>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Login to your Account
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-gray-50 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-gray-50 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>
        

        <div className="flex items-center justify-center space-x-2">
            <hr className="w-full border-gray-300" />
            <span className="font-medium text-gray-500 text-sm">OR</span>
            <hr className="w-full border-gray-300" />
        </div>

        <div className="space-y-4">
            <a href="http://localhost:5001/auth/google" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50">
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.434 36.338 48 30.652 48 24c0-1.341-.138-2.65-.389-3.917z"></path>
                </svg>
                <span className="ml-3">Login with Google</span>
            </a>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-800 rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 cursor-not-allowed opacity-50">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.685 8.164c.26 1.83.228 3.542-.782 4.41-.95.816-2.454.914-3.326.914-.928 0-2.238-.21-3.232-1.04-.999-.83-.934-2.253-.934-2.253s.065-1.425.86-2.228c.796-.803 2.133-1.04 3.062-1.04.664 0 1.258.125 1.936.426.28.12.543.25.795.385.25.134.49.277.72.426a4.4 4.4 0 0 1 1.147-.282c.1-.005.197-.01.292-.01.127 0 .252.01.375.029a.7.7 0 0 1 .1.018c-.001.03-.002.06-.002.09v.033c0 .03.001.06.002.09a.74.74 0 0 1-.098.02c-.123.018-.248.028-.375.028-.095 0-.192-.005-.292-.01a4.4 4.4 0 0 0-1.147-.282l-.018-.01-.02-.01c-.23-.15-.47-.292-.72-.426a1.4 1.4 0 0 0-.795-.385c-.678-.3-1.272-.426-1.936-.426-.93 0-2.267.237-3.062 1.04-.795.803-.86 2.228-.86 2.228s-.065 1.423.934 2.253c.994.83 2.304 1.04 3.232 1.04.872 0 2.376-.1 3.326-.915 1.012-.867 1.042-2.58.782-4.41a.5.5 0 0 1 .958-.283zm-2.075-4.71c.71-.05 1.485.243 1.975.81s.495 1.37.24 1.975c-.254.604-.897.975-1.608.925-.71-.05-1.485-.243-1.975-.81s-.495-1.37-.24-1.975c.254-.605.897-.975 1.608-.925z"/>
                </svg>
                <span className="ml-3">Login with Apple</span>
            </button>
        </div>

        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;