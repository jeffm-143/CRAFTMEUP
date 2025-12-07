
import React, { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar from "../../AdminSidebar";
import { getWalletRequests, updateWalletRequest } from '../../../services/api';

export default function WalletLogs() {
  const navigate = useNavigate();
  const [viewingFromHistory, setViewingFromHistory] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchTransactionHistory();
    
    const intervalId = setInterval(() => {
      fetchTransactions();
      fetchTransactionHistory();
    }, 10000); 
    return () => clearInterval(intervalId);
  }, []);

  const handleViewDetails = (txn, fromHistory = false) => {
    setSelectedTxn(txn);
    setViewingFromHistory(fromHistory);
    setIsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsModalOpen(false);
    setSelectedTxn(null);
    if (viewingFromHistory) {
      setShowHistory(true);
      setViewingFromHistory(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getWalletRequests();
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const response = await getWalletRequests({ includeCompleted: true });
      const completedTransactions = (response.data || []).filter(txn => 
        txn.status === 'approved' || 
        txn.status === 'rejected' || 
        txn.status === 'completed'
      );
      setTransactionHistory(completedTransactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setTransactionHistory([]);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const txn = transactions.find(t => t.id === id);
      
      if (!txn) {
        throw new Error('Transaction not found');
      }

      const amount = parseFloat(txn.amount);
      
      if (txn.type === 'top-up' && newStatus === 'approved') {
        await updateWalletRequest(id, {
          status: newStatus,
          userId: txn.user_id,
          amount: amount,
          type: 'credit'
        });
        setSuccessMessage({ type: 'approved', text: ' Request Approved Successfully!' });
      } else if (txn.type === 'cash-out' && newStatus === 'completed') {
        await updateWalletRequest(id, {
          status: newStatus,
          userId: txn.user_id,
          amount: amount,
          type: 'debit'
        });
        setSuccessMessage({ type: 'completed', text: '✓ Request Marked as Complete!' });
      } else {
        await updateWalletRequest(id, {
          status: newStatus,
          userId: txn.user_id,
          amount: 0,
          type: 'none'
        });
        setSuccessMessage({ type: 'rejected', text: '✕ Request Rejected' });
      }

      await fetchTransactions();
      await fetchTransactionHistory();
      setIsModalOpen(false);
      setSelectedTxn(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTransactionTypeIcon = (type) => {
    return type === 'top-up' ? 
      <BanknotesIcon className="w-5 h-5" /> : 
      <CreditCardIcon className="w-5 h-5" />;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Success Message */}
          {/* Success Message or Loading */}
          {loading && (
            <div className="absolute top-4 right-4 z-50 animate-slideDown">
              <div className="px-6 py-4 rounded-2xl shadow-2xl border-2 bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-300 text-white flex items-center gap-3">
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 border-3 border-white/30 rounded-full"></div>
                  <div className="absolute inset-0 border-3 border-white rounded-full border-t-transparent animate-spin"></div>
                </div>
                <span className="font-bold text-lg">Processing request...</span>
              </div>
            </div>
          )}
          {successMessage && !loading && (
            <div className="absolute top-4 right-4 z-50 animate-slideDown">
              <div className={`px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center gap-3 relative overflow-hidden ${
                successMessage.type === 'approved' || successMessage.type === 'completed'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300 text-white'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 border-red-300 text-white'
              }`}>
                <div className="text-2xl">
                  {successMessage.type === 'approved' || successMessage.type === 'completed' ? '✓' : '✕'}
                </div>
                <span className="font-bold text-lg">{successMessage.text}</span>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                  <div className="h-full bg-white animate-shrink"></div>
                </div>
              </div>
            </div>
          )}
        
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Wallet Transactions
              </h2>
              <p className="text-gray-500 text-sm mt-2">Manage top-up and cash-out requests</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-3 rounded-xl border-2 border-blue-200">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Pending Requests</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {transactions.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all font-semibold shadow-sm min-h-[83px]"
              >
                <ClockIcon className="w-5 h-5" />
                <span>History</span>
              </button>

            </div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading transactions...</p>
              </div>
            </div>
          ) : (
            <>
              {transactions.filter(txn => txn.status === 'pending').length === 0 ? (
                <div className="max-w-md mx-auto mt-20">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12 text-center border-2 border-blue-100 shadow-sm">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">All Clear!</h3>
                    <p className="text-gray-600">No pending requests at the moment</p>
                    <p className="text-sm text-gray-500 mt-2">New transactions will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {transactions
                    .filter(txn => txn.status === 'pending')
                    .map((txn) => (
                      <div
                        key={txn.id}
                        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className={`h-2 ${txn.type === 'top-up' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}></div>
                        
                        <div className="p-6">
                          {/* Type & Status */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-xl ${txn.type === 'top-up' ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-600' : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600'} shadow-sm`}>
                                {getTransactionTypeIcon(txn.type)}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {txn.type === 'top-up' ? 'Top Up' : 'Cash Out'}
                                </h3>
                                <p className="text-xs text-gray-500 font-mono">#{txn.id}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(txn.status)}`}>
                              {txn.status}
                            </span>
                          </div>

                          {/* Transaction Details */}
                          <div className="space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl mb-5 border border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 font-medium">User</span>
                              <span className="font-bold text-gray-900">{txn.full_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 font-medium">Amount</span>
                              <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">₱{txn.amount}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                              <span className="text-xs text-gray-500 font-medium">Reference</span>
                              <span className="font-mono text-xs font-semibold text-gray-700">{txn.reference_number}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleViewDetails(txn)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-md hover:shadow-lg group-hover:scale-[1.02] transform"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

{/* Transaction Details Modal */}
      {isModalOpen && selectedTxn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {viewingFromHistory && (
                  <button
                    onClick={handleCloseDetails}
                    className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
                  >
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-white">Transaction Details</h3>
                  <p className="text-blue-100 text-sm mt-1">Review and manage request</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTxn(null);
                }}
                className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-280px)]">
              {/* Transaction Type Badge */}
              <div className="flex justify-center mb-6">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${selectedTxn.type === 'top-up' ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300' : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300'}`}>
                  <div className={`p-2 rounded-lg ${selectedTxn.type === 'top-up' ? 'bg-green-200' : 'bg-blue-200'}`}>
                    {getTransactionTypeIcon(selectedTxn.type)}
                  </div>
                  <span className={`font-bold text-lg ${selectedTxn.type === 'top-up' ? 'text-green-700' : 'text-blue-700'}`}>
                    {selectedTxn.type === 'top-up' ? 'Top Up Request' : 'Cash Out Request'}
                  </span>
                </div>
              </div>

              {/* Transaction Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border-2 border-gray-200">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Transaction ID</p>
                  <p className="font-bold text-gray-900 text-lg">#{selectedTxn.id}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-200">
                  <p className="text-sm text-blue-600 font-semibold mb-2">Type</p>
                  <p className="font-bold text-blue-900 text-lg capitalize">{selectedTxn.type}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200">
                  <p className="text-sm text-green-600 font-semibold mb-2">Amount</p>
                  <p className="font-bold text-green-900 text-2xl">₱{selectedTxn.amount}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border-2 border-purple-200">
                  <p className="text-sm text-purple-600 font-semibold mb-2">Reference Number</p>
                  <p className="font-mono font-bold text-purple-900">{selectedTxn.reference_number}</p>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border-2 border-indigo-200 mb-6">
                <p className="text-sm text-indigo-600 font-semibold mb-3">User Information</p>
                <p className="font-bold text-gray-900 text-xl mb-2">{selectedTxn.full_name}</p>
                <p className="text-gray-600">{selectedTxn.email}</p>
              </div>

              {/* Proof of Payment */}
              {selectedTxn.proof_image && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-200">
                  <p className="text-sm text-orange-600 font-semibold mb-4">Proof of Payment</p>
                  <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center border-2 border-orange-100">
                    <img
                      src={
                        selectedTxn.proof_image.startsWith('data:') 
                          ? selectedTxn.proof_image 
                          : `data:image/jpeg;base64,${selectedTxn.proof_image}`
                      }
                      alt="Proof of Payment"
                      className="max-h-[25vh] max-w-full w-auto object-contain rounded-lg mb-4 shadow-md"
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-bold shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span>View Full Size</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedTxn.status === 'pending' && (
              <div className="border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white px-8 py-4">
                {selectedTxn.type === 'top-up' ? (
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleUpdateStatus(selectedTxn.id, 'approved')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl text-lg"
                    >
                      ✓ Approve Request
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedTxn.id, 'rejected')}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-bold shadow-lg hover:shadow-xl text-lg"
                    >
                      ✕ Reject Request
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(selectedTxn.id, 'completed')}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl text-lg"
                  >
                    ✓ Mark as Complete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && selectedTxn && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all z-10 shadow-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8" style={{height: 'calc(90vh - 120px)'}}>
              <img
                src={
                  selectedTxn.proof_image.startsWith('data:') 
                    ? selectedTxn.proof_image 
                    : `data:image/jpeg;base64,${selectedTxn.proof_image}`
                }
                alt="Proof of Payment"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-t-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Transaction Details</p>
                  <p className="text-gray-700 mt-1">
                    <span className="font-bold">ID:</span> #{selectedTxn.id} • 
                    <span className="font-bold ml-2">Reference:</span> {selectedTxn.reference_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-semibold">Amount</p>
                  <p className="text-2xl font-bold text-blue-900">₱{selectedTxn.amount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Transaction History</h3>
                <p className="text-blue-100 text-sm mt-1">View all completed transactions</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(85vh-150px)]">
              {transactionHistory.length > 0 ? (
                <div className="space-y-4">
                  {transactionHistory.map((txn) => (
                    <div 
                      key={txn.id} 
                      className="group bg-gradient-to-r from-white to-gray-50 p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-6">
                        {/* Left Section */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-4 rounded-2xl shadow-sm ${txn.type === 'top-up' ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
                            {getTransactionTypeIcon(txn.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-bold text-gray-900 text-lg">{txn.full_name}</p>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${txn.type === 'top-up' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                                {txn.type === 'top-up' ? '⬆ Top Up' : '⬇ Cash Out'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>
                                {new Date(txn.created_at).toLocaleDateString('en-PH', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="font-mono font-semibold text-gray-700">
                                Ref: {txn.reference_number}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                              ₱{parseFloat(txn.amount).toFixed(2)}
                            </p>
                            <span className={`inline-block mt-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${getStatusColor(txn.status)}`}>
                              {txn.status}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              handleViewDetails(txn, true);
                              setShowHistory(false);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 rounded-xl transition-all font-bold shadow-md hover:shadow-lg group-hover:scale-105 transform"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No History Yet</h3>
                  <p className="text-gray-600">Completed transactions will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }

        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink { animation: shrink 2s linear; }
      `}</style>
    </div>
  );
}