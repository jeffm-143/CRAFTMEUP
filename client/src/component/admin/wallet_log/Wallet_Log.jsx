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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
    fetchTransactionHistory();
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
      // Filter out pending transactions
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
      } else if (txn.type === 'cash-out' && newStatus === 'completed') {
        await updateWalletRequest(id, {
          status: newStatus,
          userId: txn.user_id,
          amount: amount,
          type: 'debit'
        });
      } else {
        await updateWalletRequest(id, {
          status: newStatus,
          userId: txn.user_id,
          amount: 0,
          type: 'none'
        });
      }

      await fetchTransactions();
      await fetchTransactionHistory();
      setIsModalOpen(false);
      setSelectedTxn(null);
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
      {/* Sidebar - UNIFIED NAVIGATION */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-8 py-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Wallet Transactions
            </h2>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-600 flex items-center space-x-2">
                <span>Pending Requests:</span>
                <span className="font-semibold text-blue-600 text-lg">
                  {transactions.filter(t => t.status === 'pending').length}
                </span>
              </div>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                <ClockIcon className="w-5 h-5" />
                <span>Transaction History</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading transactions...</p>
            </div>
          ) : (
            <>
              {transactions.filter(txn => txn.status === 'pending').length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow">
                  <p className="text-lg font-medium">No Top-Up or Cash-Out Requests at the moment</p>
                  <p className="text-sm mt-2">All pending requests have been processed</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {transactions
                    .filter(txn => txn.status === 'pending')
                    .map((txn) => (
                      <div
                        key={txn.id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 rounded-lg ${txn.type === 'top-up' ? 'bg-green-50' : 'bg-blue-50'}`}>
                                {getTransactionTypeIcon(txn.type)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {txn.type === 'top-up' ? 'Top Up' : 'Cash Out'}
                                </h3>
                                <p className="text-sm text-gray-500">#{txn.id}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                              {txn.status}
                            </span>
                          </div>

                          <div className="space-y-3 bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">User:</span>
                              <span className="font-medium text-gray-900">{txn.full_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-medium text-gray-900">₱{txn.amount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Reference:</span>
                              <span className="font-medium text-gray-900">{txn.reference_number}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewDetails(txn)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                          >
                            View Details
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center space-x-4">
                {viewingFromHistory && (
                  <button
                    onClick={handleCloseDetails}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                )}
                <h3 className="text-xl font-bold text-white">Transaction Details</h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTxn(null);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-medium mt-1">#{selectedTxn.id}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium mt-1 capitalize">{selectedTxn.type}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium mt-1">₱{selectedTxn.amount}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Reference Number</p>
                    <p className="font-medium mt-1">{selectedTxn.reference_number}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                    <p className="text-sm text-gray-500">User</p>
                    <p className="font-medium mt-1">{selectedTxn.full_name}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedTxn.email}</p>
                  </div>
                </div>

                {selectedTxn.proof_image && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Proof of Payment</p>
                    <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-center">
                      <img
                        src={selectedTxn.proof_image_url}
                        alt="Proof of Payment"
                        className="max-h-[20vh] max-w-full w-auto object-contain rounded-lg"
                        onError={(e) => {
                          console.error('Image failed to load:', e);
                          e.target.src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedTxn.status === 'pending' && (
                <div className="flex space-x-4 mt-6">
                  {selectedTxn.type === 'top-up' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedTxn.id, 'approved')}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedTxn.id, 'rejected')}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(selectedTxn.id, 'completed')}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Mark as Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Transaction History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {transactionHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {transactionHistory.map((txn) => (
                    <div 
                      key={txn.id} 
                      className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${txn.type === 'top-up' ? 'bg-green-100' : 'bg-blue-100'}`}>
                            {getTransactionTypeIcon(txn.type)}
                          </div>
                          <div>
                            <p className="font-medium">{txn.full_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(txn.created_at).toLocaleDateString()} - {txn.reference_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">₱{txn.amount}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                            {txn.status}
                          </span>
                          <button
                            onClick={() => {
                              handleViewDetails(txn, true);
                              setShowHistory(false);
                            }}
                            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-medium">No completed transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}