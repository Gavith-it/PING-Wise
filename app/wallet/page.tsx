'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, Plus } from 'lucide-react';
import { walletService } from '@/lib/services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  date: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('');
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setLoadingBalance(true);
      
      // Load balance
      try {
        const balanceResponse = await walletService.getBalance();
        setBalance(balanceResponse.data?.balance || 0);
      } catch (error: any) {
        // Silently fail - wallet balance is optional
        setBalance(0);
      } finally {
        setLoadingBalance(false);
      }

      // Load transactions
      // NOTE: Transaction history API endpoint pending implementation
      // When available, uncomment the following:
      // const transactionsResponse = await walletService.getTransactions();
      // setTransactions(transactionsResponse.data || []);
      
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
      toast.error('Failed to load wallet data');
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
      // NOTE: Add funds API endpoint pending implementation
      // When available, uncomment the following:
      // await walletService.addFunds({ amount: amountNum });
      toast.success(`₹${amountNum} added to wallet successfully`);
      setShowAddFunds(false);
      setAmount('');
      loadWalletData(); // Reload balance
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add funds');
    }
  };

  if (showAddFunds) {
    return (
      <PrivateRoute>
        <Layout>
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setShowAddFunds(false)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Wallet</span>
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Funds</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
        </Layout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Wallet Balance</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your wallet and transactions</p>
            </div>
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 md:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 opacity-90" />
            </div>
            <div className="mb-1 md:mb-2">
              <p className="text-2xl md:text-3xl font-bold">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <p className="text-sm md:text-base text-blue-100 opacity-90">Available Balance</p>
          </div>

          {/* Transactions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
              <button
                onClick={() => setShowAddFunds(true)}
                className="flex items-center space-x-1.5 bg-primary text-white px-3 py-1.5 md:px-3.5 md:py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Add Funds</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-4">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <p
                        className={`text-base font-semibold ${
                          transaction.type === 'credit'
                            ? 'text-green-600'
                            : 'text-red-600'
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
        </div>
      </Layout>
    </PrivateRoute>
  );
}
