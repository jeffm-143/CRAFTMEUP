import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose, duration = 3000, isLoading = false, showProgress = false }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose, isLoading]);

  useEffect(() => {
    if (showProgress && duration) {
      const interval = setInterval(() => {
        setProgress((prev) => Math.max(prev - (100 / (duration / 100)), 0));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [showProgress, duration]);

  const bgColor = isLoading ? 'bg-blue-500' : type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = isLoading ? (
    <div className="animate-spin">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
    </div>
  ) : type === 'success' ? (
    <FaCheckCircle />
  ) : (
    <FaExclamationCircle />
  );

  return (
    <div className={`fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto md:top-6 md:right-6 ${bgColor} text-white px-3 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex flex-col space-y-2 sm:space-y-2 animate-slideIn z-50 max-w-sm sm:max-w-xs md:max-w-md overflow-hidden`}>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="text-lg sm:text-xl flex-shrink-0">{icon}</div>
        <div className="flex-1 text-xs sm:text-sm md:text-base break-words">{message}</div>
        {!isLoading && !showProgress && (
          <button onClick={onClose} className="text-white hover:opacity-80 transition flex-shrink-0 ml-1 sm:ml-0">
            <FaTimes className="text-sm sm:text-base" />
          </button>
        )}
      </div>
      {(isLoading || showProgress) && (
        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Toast;
