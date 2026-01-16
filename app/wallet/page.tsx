'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet } from 'lucide-react';
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
      
      // For now, set empty array - transactions will be loaded when API is provided
      setTransactions([]);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Credits</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your credits and transactions</p>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 md:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 opacity-90" />
            </div>
            <div className="mb-1 md:mb-2">
              <p className="text-2xl md:text-3xl font-bold">{balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
            <p className="text-sm md:text-base text-blue-100 opacity-90">Available Credits</p>
          </div>

          {/* Transactions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
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
                        {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
