'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, Share2, Users, Trophy, Copy, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import toast from 'react-hot-toast';

export default function ReferAndWinPage() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState('REF123456');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Join PingWise',
        text: `Use my referral code ${referralCode} to get started!`,
        url: window.location.origin,
      }).catch(() => {
        toast.error('Failed to share');
      });
    } else {
      handleCopyCode();
    }
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-4 md:py-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6 md:mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Refer and Win</h1>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Gift className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Refer Friends & Earn Rewards
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
              Share PingWise with your friends and get rewarded
            </p>
          </div>

          {/* Referral Code Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Referral Code
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600">
                <p className="text-lg md:text-xl font-mono font-bold text-gray-900 dark:text-white">
                  {referralCode}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              onClick={handleShare}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Referral Code</span>
            </button>
          </div>

          {/* How It Works */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    Share Your Code
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share your unique referral code with friends and colleagues
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    They Sign Up
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your friends use your code when creating their account
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    You Both Win
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You and your friend both receive rewards when they sign up
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Section */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 md:p-8 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                Your Rewards
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                    Total Referrals
                  </span>
                </div>
                <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                    Rewards Earned
                  </span>
                </div>
                <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₹0</span>
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
              * Rewards will be credited to your wallet once your referrals sign up
            </p>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}
