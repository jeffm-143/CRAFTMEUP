import React, { useState } from 'react';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset, verifyResetCode, resetPassword } from '../../../services/api';
import Toast from '../../common/Toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const startTimer = () => {
    setTimer(300);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestPasswordReset(email);

      if (response.data.success) {
        setToast({
          message: 'Verification code sent to your email!',
          type: 'success',
          isLoading: false,
          showProgress: true,
          duration: 1000,
        });

        setTimeout(() => {
        setToast(null);
      }, 1000);

        setStep(2);
        startTimer();
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to send verification code. Please try again.'
      );
      setToast(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyResetCode(email, verificationCode);

      if (response.data.success) {
        setToast({
          message: 'Code verified successfully!',
          type: 'success',
          isLoading: false,
          showProgress: true,
          duration: 1000,
        });
        setStep(3);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Invalid verification code. Please try again.'
      );
      setToast(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(email, verificationCode, newPassword);

      if (response.data.success) {
        setToast({
          message: 'Password reset successfully!',
          type: 'success',
          isLoading: false,
          showProgress: true,
          duration: 1000,
        });

        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to reset password. Please try again.'
      );
      setToast(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await requestPasswordReset(email);

      if (response.data.success) {
        setToast({
          message: 'Verification code resent to your email!',
          type: 'success',
          isLoading: false,
          showProgress: true,
          duration: 1000,
        });
        startTimer();
      }
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl w-full max-w-md relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-10 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-indigo-400 to-purple-400 rounded-full opacity-10 blur-2xl"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <FaArrowLeft />
              <span className="text-sm font-medium">Back to Login</span>
            </button>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify Code' : 'Reset Password'}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === 1 ? 'Enter your email to receive a verification code' : 
               step === 2 ? 'Enter the 6-digit code sent to your email' : 
               'Create your new password'}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Email Address"
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm">
                  Email Address
                </label>
                <FaEnvelope className="absolute right-4 top-4 text-gray-400" />
              </div>

              <p className="text-xs text-gray-500 text-center">
                A code will be sent to your email.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-medium text-lg 
                  ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg'}`}
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="relative group">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              {timer > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Code expires in: <span className="font-semibold text-gray-700">{formatTime(timer)}</span>
                </p>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-medium text-lg 
                  ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg'}`}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || isLoading}
                className={`w-full py-3 rounded-xl font-medium text-lg transition-all duration-200
                  ${canResend ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
              >
                Resend Code
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="relative group">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="New Password"
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm">
                  New Password
                </label>
              </div>

              <div className="relative group">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 peer placeholder-transparent"
                  placeholder="Confirm Password"
                />
                <label className="absolute left-4 -top-2.5 text-sm text-gray-600 bg-white px-2 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm">
                  Confirm Password
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-medium text-lg 
                  ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg'}`}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>

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

export default ForgotPassword;