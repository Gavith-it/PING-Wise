'use client';

import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I create a new patient?',
    answer: 'To create a new patient, navigate to the Patients (CRM) page and click the "Add Patient" button. Fill in the required information and click "Add Patient" to save.',
  },
  {
    question: 'How do I schedule an appointment?',
    answer: 'Go to the Appointments page, click "New Appointment", select a patient, doctor, date, and time, then click "Schedule Appointment".',
  },
  {
    question: 'How do I send a campaign message?',
    answer: 'Navigate to the Campaigns page, write your message or select a template, choose recipient tags, and click "Send Campaign" or "Schedule" to schedule it for later.',
  },
  {
    question: 'How do I add a team member?',
    answer: 'Go to the Team page and click the "Add Team Member" button. Fill in the team member details including name, email, role, and department, then save.',
  },
  {
    question: 'How do I view reports?',
    answer: 'Navigate to the Reports page to view various analytics and reports about your clinic operations, appointments, and patient data.',
  },
  {
    question: 'How do I change my password?',
    answer: 'Go to Settings, then Privacy & Security section, and click on "Change Password" to update your account password.',
  },
  {
    question: 'How do I enable dark theme?',
    answer: 'Click on the menu icon in the header, then toggle the "Dark Theme" switch to enable or disable dark mode.',
  },
  {
    question: 'How do I filter patients?',
    answer: 'On the Patients (CRM) page, use the status filter pills or click the Filter button to access advanced filtering options including date range, age range, and assigned doctor.',
  },
];

export default function FAQsPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4 md:mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">FAQs</h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-0.5">Frequently asked questions</p>
            </div>
          </div>

          {/* FAQs List */}
          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none faq-no-border"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white pr-4">
                      {faq.question}
                    </p>
                  </div>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div 
                    className="px-4 md:px-6 pb-4 md:pb-6 pl-12 md:pl-14 faq-no-border"
                  >
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Help Section */}
          <div className="bg-primary/10 dark:bg-primary/20 rounded-xl md:rounded-2xl p-6 md:p-8 border border-primary/20">
            <div className="flex items-start space-x-4">
              <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Still need help?
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
                  If you can&apos;t find the answer you&apos;re looking for, please contact our support team.
                </p>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm md:text-base">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}

