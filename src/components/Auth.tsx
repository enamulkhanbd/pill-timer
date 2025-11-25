import React, { useState } from 'react';
import { Pill, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  error?: string;
  loading?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onSignUp, error, loading }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      await onSignUp(email, password, name);
    } else {
      await onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-900 mb-2">Pill Timer</h1>
          <p className="text-slate-600">Family Medication Tracking</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-slate-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-600">
              {isSignUp 
                ? 'Sign up to start tracking your family medications' 
                : 'Sign in to access your medications'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-slate-700 mb-2">
                  Family Name / Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g., Smith Family or John"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="family@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isSignUp && (
                <p className="text-slate-500 mt-1">
                  Minimum 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-slate-900">Sign In</span></>
              ) : (
                <>Don't have an account? <span className="text-slate-900">Sign Up</span></>
              )}
            </button>
          </div>

          {isSignUp && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-900 mb-2">💡 Family Sharing Tip</p>
              <p className="text-blue-700">
                Create one account and share the login credentials with your family members. 
                Everyone will see the same medications and can mark them as taken in real-time!
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 mt-6">
          Your family's health data is private and secure
        </p>
      </div>
    </div>
  );
};
