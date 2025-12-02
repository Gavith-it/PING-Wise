'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import EngagementChart from '@/components/charts/EngagementChart';
import CampaignChart from '@/components/charts/CampaignChart';
import CustomerActivityTrendChart from '@/components/charts/CustomerActivityTrendChart';

export default function ReportsPage() {
  return (
    <PrivateRoute>
      <Layout>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-[32px] font-bold text-[#6366F1] mb-2">Reports</h1>
            <p className="text-sm text-[#6B7280]">Analytics and Insights For Your Business Performance</p>
          </header>

          {/* Engagement Chart */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 md:p-6 mb-4 md:mb-6 shadow-sm hover:shadow-md transition-shadow animate-fadeIn">
            <EngagementChart />
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Campaign Performance */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <CampaignChart />
            </div>

            {/* Customer Activity Trend */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <CustomerActivityTrendChart />
            </div>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}
