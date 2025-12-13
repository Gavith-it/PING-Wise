'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Wallet, ArrowLeft, Plus } from 'lucide-react';
import { walletService } from '@/lib/services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  date: string;
}

interface WalletPopupProps {
  onClose: () => void;
  balance: number;
}

export default function WalletPopup({ onClose, balance }: WalletPopupProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when available
      // const response = await walletService.getTransactions();
      // setTransactions(response.data || []);
      
      // Mock data for now
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'debit',
          description: 'Premium Subscription',
          amount: 19.99,
          date: '2024-12-15',
        },
        {
          id: '2',
          type: 'credit',
          description: 'Referral Bonus',
          amount: 10.00,
          date: '2024-12-10',
        },
        {
          id: '3',
          type: 'credit',
          description: 'Wallet Top-up',
          amount: 50.00,
          date: '2024-12-01',
        },
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // TODO: Replace with actual API call when available
      // await walletService.addFunds({ amount: amountNum });
      toast.success(`₹${amountNum} added to wallet successfully`);
      setShowAddFunds(false);
      setAmount('');
      onClose();
      // Reload balance in parent component
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add funds');
    }
  };

  if (showAddFunds) {
    return (
      <div className="absolute top-full right-2 md:right-4 mt-2 w-[calc(100vw-1rem)] md:w-96 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl md:rounded-2xl shadow-lg z-50 overflow-hidden flex flex-col">
        <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAddFunds(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Add Funds</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleAddFunds}
            className="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
          >
            Add Funds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={popupRef}
      className="absolute top-full right-2 md:right-4 mt-2 w-[calc(100vw-1rem)] md:w-96 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl md:rounded-2xl shadow-lg z-50 max-h-[70vh] md:max-h-[80vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Wallet Balance</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="p-4 md:p-6 flex-shrink-0">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 md:p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-6 h-6 md:w-8 md:h-8 opacity-90" />
          </div>
          <div className="mb-1">
            <p className="text-2xl md:text-3xl font-bold">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <p className="text-sm md:text-base text-blue-100 opacity-90">Available Balance</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4">
        <h4 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Transactions</h4>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <p
                    className={`text-sm font-semibold ${
                      transaction.type === 'credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Funds Button */}
      <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={() => setShowAddFunds(true)}
          className="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>Add Funds</span>
        </button>
      </div>
    </div>
  );
}
