'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Home, Users, Calendar, Megaphone, UserCheck, FileText, CalendarPlus, UserPlus, Bell, Settings, ArrowLeft, CheckCircle2, Clock, DollarSign, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';

interface GuideSection {
  title: string;
  icon: React.ElementType;
  items: {
    title: string;
    description: string;
    icon?: React.ElementType;
  }[];
}

const dashboardGuide: GuideSection[] = [
  {
    title: 'Quick Actions',
    icon: CalendarPlus,
    items: [
      {
        title: 'Schedule Appointment',
        description: 'Click the blue "Schedule Appointment" button to quickly create a new appointment. A form will open in a modal where you can select patient, doctor, date, time, and appointment details.',
        icon: CalendarPlus
      },
      {
        title: 'Add Patient',
        description: 'Click the green "Add Patient" button to register a new patient. Fill in the patient details form and submit to add them to the system.',
        icon: UserPlus
      }
    ]
  },
  {
    title: 'KPI Cards',
    icon: Activity,
    items: [
      {
        title: 'Total Bookings',
        description: 'Shows the total number of appointments scheduled. Includes trend indicators showing increase or decrease.',
        icon: CalendarPlus
      },
      {
        title: 'Total Patients',
        description: 'Displays the count of all registered patients in the system with trend information.',
        icon: Users
      },
      {
        title: 'Follow-ups',
        description: 'Shows the number of patients requiring follow-up appointments.',
        icon: Clock
      },
      {
        title: 'Revenue',
        description: 'Displays total revenue in currency format (e.g., $24.5K) with trend indicators.',
        icon: DollarSign
      }
    ]
  },
  {
    title: 'Patient Activity Chart',
    icon: Activity,
    items: [
      {
        title: 'Donut Chart',
        description: 'Interactive chart showing patient distribution by status (Active, Booked, Follow-up). Hover over segments to see specific values. The center displays the total count.',
        icon: Activity
      },
      {
        title: 'Legend',
        description: 'The right side shows a legend with color-coded indicators for each patient status category.',
        icon: CheckCircle2
      }
    ]
  },
  {
    title: 'Today\'s Appointments',
    icon: Calendar,
    items: [
      {
        title: 'Appointment List',
        description: 'View all appointments scheduled for today. Each card shows patient name, time, doctor, and status. Click on any appointment to view details.',
        icon: Calendar
      },
      {
        title: 'View All',
        description: 'Click "View All" to navigate to the full appointments page with calendar view.',
        icon: ArrowLeft
      }
    ]
  }
];

const patientsGuide: GuideSection[] = [
  {
    title: 'Patient Management',
    icon: Users,
    items: [
      {
        title: 'Add New Patient',
        description: 'Click the "Add Patient" button to register a new patient. Fill in all required fields including name, age, phone, email, and optional details.',
        icon: UserPlus
      },
      {
        title: 'Search Patients',
        description: 'Use the search bar to find patients by name, email, or phone number.',
        icon: Users
      },
      {
        title: 'Filter by Status',
        description: 'Filter patients by status: Active, Booked, Follow-up, or Inactive.',
        icon: Users
      },
      {
        title: 'View Patient Details',
        description: 'Click on any patient card to view detailed information, medical history, and appointments.',
        icon: Users
      },
      {
        title: 'Edit Patient',
        description: 'Click the edit icon on a patient card to update their information.',
        icon: Users
      }
    ]
  }
];

const appointmentsGuide: GuideSection[] = [
  {
    title: 'Appointment Management',
    icon: Calendar,
    items: [
      {
        title: 'Calendar View',
        description: 'View appointments in a calendar format. Navigate between months using the arrow buttons.',
        icon: Calendar
      },
      {
        title: 'Create Appointment',
        description: 'Click the "+" button or select a date to create a new appointment. Fill in patient, doctor, date, time, type, and reason.',
        icon: CalendarPlus
      },
      {
        title: 'Appointment List',
        description: 'Below the calendar, see all appointments for the selected date. Each appointment shows patient, time, doctor, and status.',
        icon: Calendar
      },
      {
        title: 'Filter by Status',
        description: 'Filter appointments by status: Confirmed, Pending, Completed, or Cancelled.',
        icon: Calendar
      },
      {
        title: 'Edit Appointment',
        description: 'Click on any appointment to edit details or change status.',
        icon: Calendar
      }
    ]
  }
];

const campaignsGuide: GuideSection[] = [
  {
    title: 'Campaign Management',
    icon: Megaphone,
    items: [
      {
        title: 'Create Campaign',
        description: 'Create marketing campaigns to send messages to patients. Set campaign name, target audience, and message content.',
        icon: Megaphone
      },
      {
        title: 'Select Recipients',
        description: 'Choose which patients should receive the campaign based on filters like status, age, or assigned doctor.',
        icon: Users
      },
      {
        title: 'Schedule Campaign',
        description: 'Schedule campaigns to be sent at specific dates and times.',
        icon: Clock
      },
      {
        title: 'Campaign Analytics',
        description: 'View campaign performance including open rates, click rates, and engagement metrics.',
        icon: Activity
      }
    ]
  }
];

const teamGuide: GuideSection[] = [
  {
    title: 'Team Management',
    icon: UserCheck,
    items: [
      {
        title: 'Add Team Member',
        description: 'Register new doctors or staff members. Set their role, department, specialization, and contact information.',
        icon: UserPlus
      },
      {
        title: 'View Team',
        description: 'See all team members with their roles, departments, and specializations.',
        icon: UserCheck
      },
      {
        title: 'Edit Team Member',
        description: 'Update team member information including role, department, and contact details.',
        icon: UserCheck
      },
      {
        title: 'Assign Patients',
        description: 'Assign patients to specific doctors for better patient management.',
        icon: Users
      }
    ]
  }
];

const reportsGuide: GuideSection[] = [
  {
    title: 'Reports & Analytics',
    icon: FileText,
    items: [
      {
        title: 'Generate Reports',
        description: 'Create reports for appointments, patients, revenue, and other metrics.',
        icon: FileText
      },
      {
        title: 'Date Range Selection',
        description: 'Select custom date ranges to generate reports for specific time periods.',
        icon: Calendar
      },
      {
        title: 'Export Reports',
        description: 'Export reports in various formats (PDF, CSV, Excel) for external use.',
        icon: FileText
      },
      {
        title: 'Visual Analytics',
        description: 'View data visualizations including charts and graphs for better insights.',
        icon: Activity
      }
    ]
  }
];

const commonGuide: GuideSection[] = [
  {
    title: 'Header Navigation',
    icon: Home,
    items: [
      {
        title: 'Navigation Menu',
        description: 'Use the top navigation bar to switch between Dashboard, Patients, Appointments, Campaigns, Team, and Reports.',
        icon: Home
      },
      {
        title: 'Notifications',
        description: 'Click the bell icon to view notifications. You\'ll receive notifications for new appointments, patient registrations, campaign reminders, and more. The red badge shows unread count.',
        icon: Bell
      },
      {
        title: 'Settings',
        description: 'Click the settings icon to access application settings and preferences.',
        icon: Settings
      },
      {
        title: 'Help Guide',
        description: 'Click the help icon (this page) to access detailed guides for all features.',
        icon: FileText
      }
    ]
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      {
        title: 'Notification Types',
        description: 'You\'ll receive notifications for: New appointments scheduled, New patients registered, Campaign reminders, WhatsApp messages, Team member registrations, and General updates.',
        icon: Bell
      },
      {
        title: 'Viewing Notifications',
        description: 'Click the bell icon to see all notifications. Unread notifications are highlighted. Click "Mark all read" to mark all as read.',
        icon: Bell
      },
      {
        title: 'Pop-up Notifications',
        description: 'When you perform actions like adding a patient or scheduling an appointment, a pop-up notification will appear briefly at the top-right corner.',
        icon: Bell
      }
    ]
  }
];

function getPageGuide(pathname: string): GuideSection[] {
  if (pathname === '/dashboard') return [...commonGuide, ...dashboardGuide];
  if (pathname === '/crm') return [...commonGuide, ...patientsGuide];
  if (pathname === '/appointments') return [...commonGuide, ...appointmentsGuide];
  if (pathname === '/campaigns') return [...commonGuide, ...campaignsGuide];
  if (pathname === '/team') return [...commonGuide, ...teamGuide];
  if (pathname === '/reports') return [...commonGuide, ...reportsGuide];
  return commonGuide;
}

function GuideContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = searchParams.get('page') || '/dashboard';
  const guideSections = getPageGuide(currentPage);

  const getPageTitle = () => {
    if (currentPage === '/dashboard') return 'Dashboard Guide';
    if (currentPage === '/crm') return 'Patients Guide';
    if (currentPage === '/appointments') return 'Appointments Guide';
    if (currentPage === '/campaigns') return 'Campaigns Guide';
    if (currentPage === '/team') return 'Team Guide';
    if (currentPage === '/reports') return 'Reports Guide';
    return 'User Guide';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Learn how to use all features and sections of PingWise
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {guideSections.map((section, sectionIndex) => {
          const SectionIcon = section.icon;
          return (
            <div key={sectionIndex} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <SectionIcon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>
              
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => {
                  const ItemIcon = item.icon || CheckCircle2;
                  return (
                    <div key={itemIndex} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <ItemIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
        <div className="flex items-start space-x-3">
          <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Need More Help?</h3>
            <p className="text-sm text-blue-800">
              This guide is page-specific. Navigate to different pages and click the Help icon again to see guides for those sections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <PrivateRoute>
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <GuideContent />
        </Suspense>
      </Layout>
    </PrivateRoute>
  );
}

