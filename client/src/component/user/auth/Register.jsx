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
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-3">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Account Information</h2>
              <p className="text-sm text-gray-500 mt-1">Create your secure account credentials</p>
            </div>
            
            <div className="space-y-5">
              {/* Full Name */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  👤
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white peer placeholder-transparent"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                <label className="absolute left-12 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                  peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm 
                  peer-focus:text-blue-600 flex items-center gap-1">
                  Full Name
                  <span className="text-red-500 text-base">*</span>
                </label>
              </div>

              {/* Email */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  ✉️
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white peer placeholder-transparent"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <label className="absolute left-12 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                  peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm 
                  peer-focus:text-blue-600 flex items-center gap-1">
                  Email Address
                  <span className="text-red-500 text-base">*</span>
                </label>
              </div>

              {/* Password */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔒
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white peer placeholder-transparent"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <label className="absolute left-12 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                  peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm 
                  peer-focus:text-blue-600 flex items-center gap-1">
                  Password
                  <span className="text-red-500 text-base">*</span>
                </label>
                <p className="text-xs text-gray-500 mt-1.5 ml-1">Must be at least 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔑
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white peer placeholder-transparent"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <label className="absolute left-12 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
                  peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm 
                  peer-focus:text-blue-600 flex items-center gap-1">
                  Confirm Password
                  <span className="text-red-500 text-base">*</span>
                </label>
              </div>

              {/* Required Fields Notice */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 text-lg flex-shrink-0">ℹ️</span>
                  <p className="text-xs text-blue-700">
                    <span className="text-red-500 font-bold">*</span> indicates required fields
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Information */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-3">
                <span className="text-3xl">👤</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
              <p className="text-sm text-gray-500 mt-1">Tell us more about yourself (optional)</p>
            </div>
            
            <div className="space-y-5">
              {/* Phone Number */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  📱
                </div>
                <input
                  type="tel"
                  name="phone"
                  className="w-full bg-gray-50 border-2 border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white peer placeholder-transparent"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <label className="absolute left-12 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-blue-600">
                  Phone Number (Optional)
                </label>
              </div>

              {/* Gender */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  ⚧
                </div>
                <select
                  name="gender"
                  className="w-full bg-gray-50 border-2 border-gray-200 pl-12 pr-10 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer
                    text-gray-700 font-medium"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="" className="text-gray-400">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <label className="absolute left-12 -top-2.5 text-sm text-gray-600 bg-white px-2">
                  Gender (Optional)
                </label>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  🎂
                </div>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="w-full bg-gray-50 border-2 border-gray-200 pl-12 pr-4 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white text-gray-700 font-medium"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
                <label className="absolute left-12 -top-2.5 text-sm text-gray-600 bg-white px-2">
                  Date of Birth (Optional)
                </label>
              </div>

              {/* Bio */}
              <div className="relative group">
                <textarea
                  name="bio"
                  rows="4"
                  maxLength="300"
                  className="w-full bg-gray-50 border-2 border-gray-200 px-4 py-3.5 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 focus:bg-white peer placeholder-transparent 
                    resize-none text-gray-700"
                  placeholder="About Me"
                  value={formData.bio}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600">
                  About Me (Optional)
                </label>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">Tell others about yourself, your interests, or skills</p>
                  <p className={`text-xs font-medium ${formData.bio.length > 250 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {formData.bio.length}/300
                  </p>
                </div>
              </div>

              {/* Valid ID Upload - Enhanced Design */}
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                  <span className="text-lg">🆔</span>
                  Valid ID Upload
                </label>
                
                {!formData.validIdFile ? (
                  <label 
                    htmlFor="validIdFile" 
                    className="group relative bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl 
                      border-2 border-dashed border-gray-300 hover:border-blue-500 hover:from-blue-50 hover:to-indigo-50
                      transition-all duration-300 cursor-pointer block"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      {/* Upload Icon with Animation */}
                      <div className="relative mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl 
                          flex items-center justify-center shadow-lg group-hover:shadow-xl 
                          group-hover:scale-110 transition-all duration-300">
                          <FaUpload className="text-white text-2xl group-hover:animate-bounce" />
                        </div>
                        {/* Decorative Circle */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full 
                          flex items-center justify-center text-white text-xs font-bold 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          +
                        </div>
                      </div>

                      {/* Text Content */}
                      <div>
                        <p className="text-lg font-bold text-gray-800 mb-2">
                          Click to Upload Valid ID
                        </p>
                        <p className="text-sm text-gray-600 mb-3 max-w-xs mx-auto">
                          Government ID, School ID, or any valid identification document
                        </p>
                        
                        {/* File Requirements */}
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full 
                          border border-gray-200 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Max 5MB • JPG, PNG, PDF</span>
                        </div>
                      </div>
                    </div>

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
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-300">
                    {/* Success Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-800">File Uploaded</p>
                          <p className="text-xs text-green-600 truncate max-w-[180px]">
                            {formData.validIdFile.name}
                          </p>
                        </div>
                      </div>
                      
                      <label 
                        htmlFor="validIdFile" 
                        className="cursor-pointer bg-white hover:bg-gray-50 px-4 py-2 rounded-lg 
                          border border-green-300 text-green-700 text-sm font-medium transition-colors"
                      >
                        Change
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

                    {/* Preview */}
                    {formData.validIdFile.type.startsWith('image/') ? (
                      <div className="relative rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={URL.createObjectURL(formData.validIdFile)}
                          alt="ID Preview"
                          className="w-full max-h-80 object-contain bg-white"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-8 border-2 border-dashed border-green-300">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
                            <span className="text-3xl">📄</span>
                          </div>
                          <p className="text-red-600 font-semibold text-base">PDF Document</p>
                          <p className="text-gray-500 text-sm mt-1">Preview not available</p>
                        </div>
                      </div>
                    )}

                    {/* File Info */}
                    <div className="mt-4 flex items-center justify-between text-xs text-green-700 bg-white/50 px-4 py-2 rounded-lg">
                      <span>
                        Size: {(formData.validIdFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span>
                        Type: {formData.validIdFile.type.split('/')[1].toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-1">Privacy & Security</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Your personal information is encrypted and secure. We only use your ID for verification purposes 
                      and never share it with third parties.
                    </p>
                  </div>
                </div>
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