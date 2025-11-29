'use client';

import { FileText } from 'lucide-react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';

export default function ReportsPage() {
  return (
    <PrivateRoute>
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reports Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            We&apos;re working on comprehensive reporting features for your clinic.
          </p>
          <button className="bg-primary text-white px-6 py-3 rounded-2xl font-medium hover:bg-primary-dark transition-colors">
            Get Notified
          </button>
        </div>
      </Layout>
    </PrivateRoute>
  );
}
