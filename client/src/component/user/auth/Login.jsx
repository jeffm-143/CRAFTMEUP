// LoginForm.jsx
import React, { useState } from 'react';
import { FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../services/api';
import { getAdminDashboardData } from '../../../services/adminApi';
import Toast from '../../common/Toast';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Hardcoded admin credentials
    if (formData.email === 'admin@craftmeup.com' && formData.password === 'admin') {
      const adminUser = {
        id: 'admin1',
        email: 'admin@craftmeup.com',
        role: 'admin',
        type: 'admin',
        fullName: 'Admin User'
      };

      const mockDashboardData = {
        stats: [
          { title: 'Total Users', value: '1,234', icon: 'UsersIcon' },
          { title: 'Active Services', value: '856', icon: 'ClipboardIcon' },
          { title: 'Total Revenue', value: '₱45,678', icon: 'WalletIcon' },
          { title: 'Pending Reports', value: '23', icon: 'FlagIcon' },
          { title: 'Active Sessions', value: '189', icon: 'ClockIcon' }
        ],
        reports: [
          { id: 1, name: 'John Doe', type: 'Service', submittedBy: 'User', date: '2024-01-20', status: 'Pending' },
          { id: 2, name: 'Jane Smith', type: 'User', submittedBy: 'Admin', date: '2024-01-19', status: 'Resolved' }
        ],
        dashboard: {
          recentActivity: [],
          notifications: []
        }
      };
      
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('adminDashboardData', JSON.stringify(mockDashboardData));
      
      setToast({
        message: 'Login successful!',
        type: 'success',
        isLoading: false,
        showProgress: true,
        duration: 1000,
      });

      const redirectTimer = setTimeout(() => {
        navigate('/admin-dashboard');
      }, 1000);

      setIsLoading(false);
      return () => clearTimeout(redirectTimer);
    }

    // Continue with regular user login flow
    try {
      const response = await login(formData.email, formData.password);

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Check if user has admin role
        if (response.data.user && (response.data.user.role === 'admin' || response.data.user.type === 'admin')) {
          try {
            const adminDataRes = await getAdminDashboardData(response.data.token);
            localStorage.setItem('adminDashboardData', JSON.stringify(adminDataRes.data));
            
            setToast({
              message: 'Login successful!',
              type: 'success',
              isLoading: false,
              showProgress: true,
              duration: 1000,
            });

            const redirectTimer = setTimeout(() => {
              navigate('/admin-dashboard');
            }, 1000);

            setIsLoading(false);
            return () => clearTimeout(redirectTimer);
          } catch (adminErr) {
            setToast({
              message: 'Failed to retrieve admin dashboard data.',
              type: 'error',
              isLoading: false,
              showProgress: false,
              duration: 2000,
            });
            localStorage.clear();
            setIsLoading(false);
          }
        } else {
          setToast({
            message: 'Login successful!',
            type: 'success',
            isLoading: false,
            showProgress: true,
            duration: 1000,
          });

          const redirectTimer = setTimeout(() => {
            navigate('/dashboard');
          }, 1000);

          setIsLoading(false);
          return () => clearTimeout(redirectTimer);
        }
      } else {
        setToast({
          message: 'Invalid response format from server',
          type: 'error',
          isLoading: false,
          showProgress: false,
          duration: 2000,
        });
        setIsLoading(false);
      }
    } catch (error) {
      let errorMessage = 'An error occurred during login';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Invalid email or password';
            break;
          case 404:
            errorMessage = 'Account not found';
            break;
          default:
            errorMessage = error.response.data?.message || 'Server error';
        }
      }
      
      setToast({
        message: errorMessage,
        type: 'error',
        isLoading: false,
        showProgress: false,
        duration: 3000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white animate-gradient-xy flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl w-full max-w-md relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-10 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-indigo-400 to-purple-400 rounded-full opacity-10 blur-2xl"></div>

        <div className="relative">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Welcome Back
            </h2>
            <p className="text-gray-600 mt-2">Access your crafting journey</p>
          </div>

          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="relative group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                placeholder="Email"
              />
              <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm">
                Email address
              </label>
              <FaEnvelope className="absolute right-4 top-4 text-gray-400" />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                placeholder="Password"
              />
              <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-medium text-lg 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg'}`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-8 text-center">
            <span className="text-gray-600">Don't have an account?</span>
            <button
              onClick={() => navigate('/register')}
              className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Create account
            </button>
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          isLoading={toast.isLoading}
          showProgress={toast.showProgress}
          duration={toast.duration}
        />
      )}
    </div>
  );
};

export default LoginForm;
