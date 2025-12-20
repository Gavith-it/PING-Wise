'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Crown, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import toast from 'react-hot-toast';

export default function PremiumPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // NOTE: Premium upgrade API endpoint pending implementation
      // When available, uncomment the following:
      // await premiumService.upgrade(selectedPlan);
      toast.success('Premium upgrade functionality will be available soon!');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      toast.error('Failed to upgrade to premium');
    } finally {
      setLoading(false);
    }
  };

  const premiumFeatures = [
    'Ad-free experience',
    'Unlimited campaigns',
    'Advanced analytics',
    'Priority support',
    'Custom branding',
    'API access',
  ];

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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Get Premium</h1>
          </div>

          {/* Premium Introduction */}
          <div className="text-center mb-8 md:mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              PingWise Premium
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
              Unlock all features
            </p>
          </div>

          {/* Pricing Plans */}
          <div className="space-y-4 mb-8 md:mb-10">
            {/* Annual Plan */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`relative bg-white dark:bg-gray-800 rounded-xl p-5 md:p-6 border-2 cursor-pointer transition-all ${
                selectedPlan === 'annual'
                  ? 'border-primary shadow-lg scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {selectedPlan === 'annual' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="text-center">
                <p className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Annual
                </p>
                <div className="flex items-baseline justify-center space-x-1 mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-primary">$199</span>
                  <span className="text-sm md:text-base text-gray-500 dark:text-gray-400">/year</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Save $40
                </p>
              </div>
            </div>

            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`relative bg-white dark:bg-gray-800 rounded-xl p-5 md:p-6 border-2 cursor-pointer transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-primary shadow-lg scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <p className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Monthly
                </p>
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-3xl md:text-4xl font-bold text-primary">$19.99</span>
                  <span className="text-sm md:text-base text-gray-500 dark:text-gray-400">/month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features */}
          <div className="mb-8 md:mb-10">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">
              Premium Features
            </h3>
            <div className="space-y-3 md:space-y-4">
              {premiumFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Button */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-primary text-white py-3 md:py-4 px-6 rounded-xl font-semibold text-base md:text-lg hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        </div>
      </Layout>
    </PrivateRoute>
  );
}
