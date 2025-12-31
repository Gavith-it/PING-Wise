'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const success = await login(userName, password);
    
    if (success) {
      router.replace('/dashboard');
    } else {
      setLoading(false);
    }
  };

  // Show loading only while checking initial authentication (not during login)
  if (authLoading && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated (after login or from session), redirect instantly
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden fixed w-full">
      <div id="app-container" className="w-full h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Header with gradient background */}
        <header 
          className="relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #1A3E9E 0%, #2563EB 100%)',
            paddingTop: 'env(safe-area-inset-top, 0px)'
          }}
        >
          <div className="relative z-10 px-4 pt-8 pb-10">
            {/* Logo */}
            <div className="flex items-center mb-6 animate-fade-in">
              <span className="text-xl font-bold text-white">Pingwise</span>
            </div>

            {/* Welcome text */}
            <div className="animate-slide-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
              <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight tracking-tight">
                Hey There! 👋
              </h1>
            </div>
          </div>

          {/* Decorative blobs */}
          <div 
            className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pulse-glow"
            style={{ backgroundColor: '#1A3E9E' }}
          />
          <div 
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl pulse-glow"
            style={{ backgroundColor: '#2563EB', animationDelay: '2s' }}
          />
          <div 
            className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full blur-2xl opacity-20 pulse-glow"
            style={{ animationDelay: '1s', background: 'white' }}
          />

          {/* Floating illustration */}
          <div 
            className="absolute bottom-4 right-4 opacity-20 float-animation animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <svg className="w-24 h-24" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="30" width="120" height="100" rx="16" fill="white" opacity="0.15" />
              <rect x="30" y="45" width="45" height="35" rx="8" fill="white" opacity="0.25" />
              <rect x="85" y="45" width="45" height="35" rx="8" fill="white" opacity="0.25" />
              <path d="M35 100 L50 90 L65 95 L80 80 L95 85 L110 70 L125 75" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
              <circle cx="50" cy="90" r="4" fill="white" opacity="0.4" />
              <circle cx="80" cy="80" r="4" fill="white" opacity="0.4" />
              <circle cx="110" cy="70" r="4" fill="white" opacity="0.4" />
              <circle cx="40" cy="115" r="8" fill="white" opacity="0.3" />
              <circle cx="58" cy="115" r="8" fill="white" opacity="0.25" />
              <circle cx="76" cy="115" r="8" fill="white" opacity="0.2" />
            </svg>
          </div>
        </header>

        {/* Main content card */}
        <main className="relative -mt-6 animate-slide-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
          <div 
            className="rounded-t-3xl shadow-2xl border-t-2 border-white border-opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              minHeight: 'calc(100vh - 180px)'
            }}
          >
            <div className="px-4 pt-6 pb-6">
              {/* Form header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Enter your credentials</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#1A3E9E15', color: '#1A3E9E' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field */}
                <div className="relative">
                  <label htmlFor="userName" className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Username
                  </label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    autoComplete="username"
                    className="input-field w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm font-medium shadow-sm transition-all duration-400"
                    style={{
                      '--tw-ring-color': '#1A3E9E'
                    } as React.CSSProperties}
                    placeholder="Enter username"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="input-field w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm font-medium pr-12 shadow-sm transition-all duration-400"
                      style={{
                        '--tw-ring-color': '#1A3E9E'
                      } as React.CSSProperties}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none active:text-gray-600 p-1 transition-transform hover:scale-110"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-3.5 h-3.5 rounded border-2 border-gray-300 focus:ring-2 focus:ring-offset-0"
                      style={{
                        '--tw-ring-color': '#1A3E9E'
                      } as React.CSSProperties}
                    />
                    <span className="ml-2 text-xs font-medium text-gray-700">Remember me</span>
                  </label>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      toast('Forgot password feature coming soon', { icon: 'ℹ️' });
                    }}
                    className="text-xs font-bold hover:underline"
                    style={{ color: '#1A3E9E' }}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-white font-bold rounded-xl focus:outline-none focus:ring-4 focus:ring-offset-0 mt-6 text-sm shadow-xl relative z-10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#1A3E9E',
                    boxShadow: '0 10px 30px -5px rgba(26, 62, 158, 0.5)'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.97)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center relative z-10">
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      Login
                    </span>
                  )}
                </button>

                {/* Role Info Badge */}
                <div 
                  className="mt-5 p-4 rounded-xl border-2"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderColor: 'rgba(26, 62, 158, 0.2)'
                  }}
                >
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#1A3E9E15' }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#1A3E9E' }}>
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Role-based access enabled</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Admin, Staff, Manager roles supported</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center space-y-3 mt-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                  <div className="flex items-center justify-center space-x-3 text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">SSL Encrypted</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">© Pingwise 2026. All rights reserved.</p>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(2deg); }
          66% { transform: translateY(-8px) rotate(-2deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        .animate-slide-up {
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        .pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        .input-field:focus {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(26, 62, 158, 0.12);
        }

        .btn-primary {
          -webkit-tap-highlight-color: transparent;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn-primary:active::before {
          width: 300px;
          height: 300px;
        }

        #app-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
