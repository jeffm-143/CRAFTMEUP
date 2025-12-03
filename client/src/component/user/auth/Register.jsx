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
    course: '',
    year: '',
    role: '',
    studentIdFile: null,
    studyLoadFile: null,
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

  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  try {
    const formDataToSend = new FormData();

    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('course', formData.course);
    formDataToSend.append('year', formData.year);
    formDataToSend.append('role', formData.role);

    if (formData.studentIdFile) {
      formDataToSend.append('studentId', formData.studentIdFile);
    }
    if (formData.studyLoadFile) {
      formDataToSend.append('studyLoad', formData.studyLoadFile);
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

      const redirectTimer = setTimeout(() => {
        navigate('/');
      }, 2000);

      return () => clearTimeout(redirectTimer);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-8 rounded-b-[40px] shadow-lg">
        <button onClick={handleBack} className="flex items-center space-x-2">
          <FaArrowLeft />
          <span>{step > 1 ? 'Back' : 'Sign In'}</span>
        </button>

        <h1 className="text-2xl font-bold mt-4">Create Account</h1>
        <p className="text-white/80 mt-1">Step {step} of 3</p>

        {/* Progress Bar */}
        <div className="mt-4 h-1 bg-white/20 rounded-full">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  required
                  className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Full Name
                </label>
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Email Address
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Password
                </label>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 
                  transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-focus:-top-2.5 peer-focus:text-sm">
                  Confirm Password
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
              {/* Course */}
              <div className="relative">
                <select
                  name="course"
                  required
                  className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer"
                  value={formData.course}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select a Course</option>
                  <option value="BS IN ACCOUNTANCY">BS IN ACCOUNTANCY</option>
                  <option value="BS IN BUSINESS ADMINISTRATION">BS IN BUSINESS ADMINISTRATION</option>
                  <option value="BS IN CRIMINOLOGY">BS IN CRIMINOLOGY</option>
                  <option value="BS IN CUSTOMS ADMINISTRATION">BS IN CUSTOMS ADMINISTRATION</option>
                  <option value="BS IN INFORMATION TECHNOLOGY">BS IN INFORMATION TECHNOLOGY</option>
                  <option value="BS IN COMPUTER SCIENCE">BS IN COMPUTER SCIENCE</option>
                  <option value="BS IN OFFICE ADMINISTRATION">BS IN OFFICE ADMINISTRATION</option>
                  <option value="BS IN SOCIAL WORK">BS IN SOCIAL WORK</option>
                  <option value="BACHELOR OF SECONDARY EDUCATION">BACHELOR OF SECONDARY EDUCATION</option>
                  <option value="BACHELOR OF ELEMENTARY EDUCATION">BACHELOR OF ELEMENTARY EDUCATION</option>
                </select>
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2">
                  Course
                </label>
              </div>

              {/* Year */}
              <div className="relative">
                <select
                  name="year"
                  required
                  className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl outline-none 
                    transition-all duration-200 focus:border-blue-500 peer"
                  value={formData.year}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select a Year Level</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2">
                  Year Level
                </label>
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Student ID */}
                <div>
                  <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 
                    transition-colors cursor-pointer text-center min-h-48 flex flex-col items-center justify-center">
                    {!formData.studentIdFile ? (
                      <label htmlFor="studentIdFile" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                          <FaUpload className="text-blue-500" />
                        </div>
                        <p className="text-sm font-medium">Upload Student ID</p>
                        <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                        <input
                          id="studentIdFile"
                          type="file"
                          name="studentIdFile"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="w-full">
                        <p className="text-xs text-gray-600 mb-3 truncate px-2">
                          {formData.studentIdFile.name}
                        </p>
                        {formData.studentIdFile.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(formData.studentIdFile)}
                            alt="Student ID Preview"
                            className="w-full h-40 object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <div className="w-full h-40 bg-red-50 rounded-lg flex items-center justify-center mb-2">
                            <p className="text-red-600 text-sm">📄 PDF File</p>
                          </div>
                        )}
                        <label htmlFor="studentIdFile" className="cursor-pointer text-blue-500 text-xs hover:underline">
                          Change File
                          <input
                            id="studentIdFile"
                            type="file"
                            name="studentIdFile"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Study Load */}
                <div>
                  <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 
                    transition-colors cursor-pointer text-center min-h-48 flex flex-col items-center justify-center">
                    {!formData.studyLoadFile ? (
                      <label htmlFor="studyLoadFile" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                          <FaUpload className="text-blue-500" />
                        </div>
                        <p className="text-sm font-medium">Upload Study Load</p>
                        <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                        <input
                          id="studyLoadFile"
                          type="file"
                          name="studyLoadFile"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="w-full">
                        <p className="text-xs text-gray-600 mb-3 truncate px-2">
                          {formData.studyLoadFile.name}
                        </p>
                        {formData.studyLoadFile.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(formData.studyLoadFile)}
                            alt="Study Load Preview"
                            className="w-full h-40 object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <div className="w-full h-40 bg-red-50 rounded-lg flex items-center justify-center mb-2">
                            <p className="text-red-600 text-sm">📄 PDF File</p>
                          </div>
                        )}
                        <label htmlFor="studyLoadFile" className="cursor-pointer text-blue-500 text-xs hover:underline">
                          Change File
                          <input
                            id="studyLoadFile"
                            type="file"
                            name="studyLoadFile"
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
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-3">
              {[
                {
                  value: 'Learner',
                  icon: '🎓',
                  label: 'Learner',
                  desc: 'I need help learning a craft-based skill',
                },
                {
                  value: 'Tutor',
                  icon: '👨‍🏫',
                  label: 'Tutor',
                  desc: 'I can tutor others in craft-based skills',
                },
                {
                  value: 'Both',
                  icon: '🤝',
                  label: 'Both',
                  desc: 'I can help others and need help too',
                },
              ].map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    formData.role === role.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{role.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{role.label}</p>
                      <p className="text-sm text-gray-500">{role.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8">
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl 
                font-medium text-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl 
                font-medium text-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Create Account
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}
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

export default RegisterForm;
