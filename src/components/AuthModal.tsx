import React, { useState } from 'react';
import { X, LogOut, Mail, Lock, User } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';

export function AuthModal() {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    firebaseUser,
    userProfile,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    logout,
  } = useQuickKart();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    const res = await signInWithGoogle();
    setBusy(false);
    if (!res.ok && res.error) setError(res.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'register' && name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    setBusy(true);
    const res =
      mode === 'login'
        ? await signInWithEmail(email, password)
        : await registerWithEmail(name, email, password);
    setBusy(false);
    if (!res.ok && res.error) setError(res.error);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-[#E5E4DF] rounded-xl w-full max-w-md overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[#E5E4DF] flex items-center justify-between">
          <h2 id="auth-modal-title" className="text-lg font-bold text-[#181A18]">
            {firebaseUser ? 'Your QuickKart Account' : 'Sign in to QuickKart'}
          </h2>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close account dialog"
            className="p-2 text-[#5C615C] hover:text-[#181A18] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {firebaseUser ? (
            <div className="space-y-5">
              <div className="p-4 bg-[#FAF9F6] border border-[#E5E4DF] rounded-lg space-y-1.5">
                <p className="text-base font-semibold text-[#181A18]">
                  {userProfile?.displayName || firebaseUser.displayName || 'QuickKart Member'}
                </p>
                <p className="text-sm text-[#5C615C]">{firebaseUser.email}</p>
                <p className="text-xs text-[#5C615C] pt-1">
                  Role: <span className="font-semibold text-[#181A18] capitalize">{userProfile?.role || 'customer'}</span>
                  {' · '}
                  <span>{userProfile?.deliveryZone || 'Dehradun, Uttarakhand'}</span>
                </p>
              </div>

              <p className="text-xs text-[#5C615C] leading-relaxed">
                Your profile and orders sync directly with Cloud Firestore when signed in with a verified account.
              </p>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setAuthModalOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#181A18] bg-[#F3F2EE] hover:bg-[#E8E6E0] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#181A18] bg-white border border-[#D4D3CC] hover:bg-[#FAF9F6] rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.29a12 12 0 0 0 0 10.8l4-3.1z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.6l4 3.1c.94-2.84 3.59-4.95 6.71-4.95z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-[#E5E4DF]" />
                <span className="px-3 text-xs text-[#5C615C]">or use email &amp; password</span>
                <div className="flex-grow border-t border-[#E5E4DF]" />
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F3F2EE] rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    mode === 'login' ? 'bg-white text-[#181A18] shadow-xs' : 'text-[#5C615C]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    mode === 'register' ? 'bg-white text-[#181A18] shadow-xs' : 'text-[#5C615C]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {mode === 'register' && (
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-medium text-[#181A18] mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#5C615C] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rohan Sharma"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-[#181A18] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5C615C] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@dgu.ac.in"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium text-[#181A18] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5C615C] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="auth-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                    />
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 leading-relaxed">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {busy
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Sign In with Email'
                    : 'Create QuickKart Account'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
