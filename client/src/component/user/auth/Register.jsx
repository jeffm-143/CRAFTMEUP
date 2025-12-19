import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUpload } from 'react-icons/fa';
import { register } from '../../../services/api';
import Toast from '../../common/Toast';

const RegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    bio: '',
    role: '',
    validIdFile: null,
  });

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const formDataToSend = new FormData();

      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phone', formData.phone || '');
      formDataToSend.append('gender', formData.gender || '');
      formDataToSend.append('dateOfBirth', formData.dateOfBirth || '');
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('role', formData.role);

      if (formData.validIdFile) {
        formDataToSend.append('validId', formData.validIdFile);
      }

      const response = await register(formDataToSend);

      if (response.data.token) {
        setToast({
          message: 'Account created successfully!',
          type: 'success',
          isLoading: false,
          showProgress: true,
          duration: 2000,
        });

        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Registration failed. Please try again.'
      );
      setToast(null);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl w-full max-w-md relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-10 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-indigo-400 to-purple-400 rounded-full opacity-10 blur-2xl"></div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-6 rounded-t-3xl relative">
          <button onClick={handleBack} className="flex items-center space-x-2 text-sm">
            <FaArrowLeft />
            <span>{step > 1 ? 'Back' : 'Sign In'}</span>
          </button>

          <h1 className="text-2xl font-bold mt-4">Create Account</h1>
          <p className="text-white/80 mt-1 text-sm">Step {step} of 3</p>

          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-white/20 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="px-6 py-6 relative">
        {/* STEP 1: Account Information */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
            
            <div className="space-y-6">
              {/* Full Name */}
              <div className="relative group">
                <input
                  type="text"
                  name="fullName"
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Full Name *
                </label>
              </div>

              {/* Email */}
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Email Address *
                </label>
              </div>

              {/* Password */}
              <div className="relative group">
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Password *
                </label>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Confirm Password *
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Information */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
            
            <div className="space-y-6">
              {/* Phone Number */}
              <div className="relative group">
                <input
                  type="tel"
                  name="phone"
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Phone Number (Optional)
                </label>
              </div>

              {/* Gender */}
              <div className="relative group">
                <select
                  name="gender"
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer appearance-none cursor-pointer"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2">
                  Gender (Optional)
                </label>
              </div>

              {/* Date of Birth */}
              <div className="relative group">
                <input
                  type="date"
                  name="dateOfBirth"
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2">
                  Date of Birth (Optional)
                </label>
              </div>

              {/* Bio */}
              <div className="relative group">
                <textarea
                  name="bio"
                  rows="4"
                  maxLength="300"
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent resize-none"
                  placeholder="About Me"
                  value={formData.bio}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  About Me (Optional)
                </label>
                <p className="text-xs text-gray-400 mt-1 text-right">{formData.bio.length}/300</p>
              </div>

              {/* Valid ID Upload */}
              <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 
                transition-colors cursor-pointer text-center">
                {!formData.validIdFile ? (
                  <label htmlFor="validIdFile" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <FaUpload className="text-blue-500 text-2xl" />
                    </div>
                    <p className="text-base font-medium text-gray-800">Upload Valid ID</p>
                    <p className="text-sm text-gray-500 mt-2">Government ID, School ID, or any valid identification</p>
                    <p className="text-xs text-gray-400 mt-1">Max size: 5MB (JPG, PNG, PDF)</p>
                    <input
                      id="validIdFile"
                      type="file"
                      name="validIdFile"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="w-full">
                    <p className="text-sm text-gray-600 mb-3 truncate px-2 font-medium">
                      ✓ {formData.validIdFile.name}
                    </p>
                    {formData.validIdFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(formData.validIdFile)}
                        alt="ID Preview"
                        className="w-full max-h-64 object-contain rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-40 bg-red-50 rounded-lg flex items-center justify-center mb-3">
                        <p className="text-red-600 text-base">📄 PDF File</p>
                      </div>
                    )}
                    <label htmlFor="validIdFile" className="cursor-pointer text-blue-500 text-sm hover:underline font-medium">
                      Change File
                      <input
                        id="validIdFile"
                        type="file"
                        name="validIdFile"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Role Selection */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Choose Your Role</h2>
            <p className="text-sm text-gray-600 mb-6">How would you like to use CraftMeUp?</p>
            
            <div className="space-y-3">
              {[
                {
                  value: 'Learner',
                  icon: '🎓',
                  label: 'Learner',
                  desc: 'I want to learn new skills and crafts',
                },
                {
                  value: 'Tutor',
                  icon: '👨‍🏫',
                  label: 'Tutor',
                  desc: 'I can teach others skills and crafts',
                },
                {
                  value: 'Both',
                  icon: '🤝',
                  label: 'Both',
                  desc: 'I want to both learn and teach skills',
                },
              ].map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={`w-full p-5 rounded-xl border-2 transition-all ${
                    formData.role === role.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-3xl mr-4">{role.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-base text-gray-800">{role.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{role.desc}</p>
                    </div>
                    {formData.role === role.value && (
                      <div className="ml-auto">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can change your role anytime in your profile settings after registration.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8">
          {step < 3 ? (
            <button
              onClick={() => {
                // Validation for step 1
                if (step === 1) {
                  if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
                    setError('Please fill in all required fields');
                    return;
                  }
                  if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    return;
                  }
                }
                setError('');
                setStep(step + 1);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl 
                font-medium text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!formData.role}
              className={`w-full py-4 rounded-xl font-medium text-lg transition-all shadow-md ${
                formData.role
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create Account
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Info Text */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
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

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default RegisterForm;