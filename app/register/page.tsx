'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signUpWithEmail,
  signInWithGoogle,
  signInAsGuest,
  createRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
  ConfirmationResult,
  RecaptchaVerifier,
} from '@/lib/firebase/auth';
import {
  Wallet,
  Loader2,
  ArrowRight,
  UserCheck,
  Mail,
  Phone,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Alert } from '@/components/ui/Alert';

const COUNTRY_CODES = [
  { code: '+880', label: '🇧🇩 Bangladesh (+880)' },
  { code: '+1', label: '🇺🇸 USA / Canada (+1)' },
  { code: '+44', label: '🇬🇧 UK (+44)' },
  { code: '+91', label: '🇮🇳 India (+91)' },
  { code: '+971', label: '🇦🇪 UAE (+971)' },
  { code: '+966', label: '🇸🇦 Saudi Arabia (+966)' },
  { code: '+65', label: '🇸🇬 Singapore (+65)' },
  { code: '+60', label: '🇲🇾 Malaysia (+60)' },
  { code: '+61', label: '🇦🇺 Australia (+61)' },
];

export default function RegisterPage() {
  const router = useRouter();

  // Provider tabs: 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Email form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phone form state
  const [phoneName, setPhoneName] = useState('');
  const [countryCode, setCountryCode] = useState('+880');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Loading states
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // 1. Email Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoadingEmail(true);

    try {
      const user = await signUpWithEmail(email.trim(), password, fullName.trim());
      
      // Initialize profile in MongoDB Atlas
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          fullName: fullName.trim(),
        }),
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      let message = 'Registration failed';
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          message = 'An account with this email address already exists. Please sign in instead.';
        } else if (err.message.includes('weak-password')) {
          message = 'Password is too weak. Please use at least 6 characters.';
        } else {
          message = err.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setLoadingEmail(false);
    }
  };

  // 2. Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const user = await signInWithGoogle();
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email || 'user@example.com',
          fullName: user.displayName || user.email?.split('@')[0] || 'User',
        }),
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes('popup-closed-by-user')) {
        setErrorMessage(err.message);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // 3. Guest / Anonymous
  const handleGuestSignIn = async () => {
    setLoadingGuest(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const user = await signInAsGuest();
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: 'guest@demo.local',
          fullName: 'Guest User',
        }),
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Guest sign in failed';
      setErrorMessage(message);
    } finally {
      setLoadingGuest(false);
    }
  };

  // 4. Phone: Send SMS OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '').replace(/^0+/, '');
    if (!cleanNumber || cleanNumber.length < 6) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanNumber}`;
    setLoadingPhone(true);

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = createRecaptcha('recaptcha-register-container');
      }

      const confirmation = await sendPhoneOtp(fullPhoneNumber, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmation;
      setOtpSent(true);
      setSuccessNotice(`Verification code sent to ${fullPhoneNumber}`);
    } catch (err: unknown) {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore
        }
        recaptchaVerifierRef.current = null;
      }
      let message = 'Failed to send SMS verification code.';
      if (err instanceof Error) {
        if (err.message.includes('invalid-phone-number')) {
          message = 'Invalid phone number format. Please check your number.';
        } else if (err.message.includes('quota-exceeded')) {
          message = 'SMS quota exceeded for today. Please try Email or Google register.';
        } else if (err.message.includes('captcha-check-failed')) {
          message = 'reCAPTCHA verification failed. Please try again.';
        } else {
          message = err.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setLoadingPhone(false);
    }
  };

  // 4b. Phone: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResultRef.current) {
      setErrorMessage('Verification session expired. Please request a new code.');
      setOtpSent(false);
      return;
    }

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoadingPhone(true);
    setErrorMessage(null);

    try {
      const user = await verifyPhoneOtp(confirmationResultRef.current, otpCode.trim());
      const cleanPhone = user.phoneNumber || `${countryCode}${phoneNumber}`;
      
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: `${cleanPhone.replace(/[^0-9]/g, '')}@phone.local`,
          fullName: phoneName.trim() || cleanPhone,
        }),
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      let message = 'Invalid or expired verification code.';
      if (err instanceof Error) {
        if (err.message.includes('invalid-verification-code')) {
          message = 'The 6-digit code is incorrect. Please check and re-enter.';
        } else if (err.message.includes('code-expired')) {
          message = 'This verification code has expired. Please request a new one.';
        } else {
          message = err.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setLoadingPhone(false);
    }
  };

  const isAnyLoading = loadingEmail || loadingGoogle || loadingGuest || loadingPhone;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-4">
          <Wallet className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create an Account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose any of your enabled sign-in providers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {/* Notifications */}
          {errorMessage && (
            <div className="mb-6">
              <Alert variant="error" title="Registration Issue">
                {errorMessage}
              </Alert>
            </div>
          )}

          {successNotice && (
            <div className="mb-6">
              <Alert variant="success" title="Code Sent">
                {successNotice}
              </Alert>
            </div>
          )}

          {/* Invisible reCAPTCHA container for Phone Auth */}
          <div id="recaptcha-register-container" />

          {/* Social / Fast Providers */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loadingGoogle ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loadingGuest ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              ) : (
                <UserCheck className="h-4 w-4 text-indigo-600" />
              )}
              <span>Continue as Guest (Instant Access)</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                or register with email / phone
              </span>
            </div>
          </div>

          {/* Provider Selector Switch: Email vs Phone */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'email'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'phone'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Phone (SMS OTP)</span>
            </button>
          </div>

          {/* METHOD 1: Email Form */}
          {authMethod === 'email' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sajjad Hossain"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAnyLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-70"
                >
                  {loadingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account with Email</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* METHOD 2: Phone Registration Form */}
          {authMethod === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="phoneName"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Your Full Name
                    </label>
                    <input
                      id="phoneName"
                      type="text"
                      required
                      value={phoneName}
                      onChange={(e) => setPhoneName(e.target.value)}
                      placeholder="e.g. Sajjad Hossain"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="countryCodeRegister"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Country Code
                    </label>
                    <select
                      id="countryCodeRegister"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="phoneNumberRegister"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-medium">
                        {countryCode}
                      </div>
                      <input
                        id="phoneNumberRegister"
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="1712 345678"
                        className="w-full rounded-xl border border-slate-200 pl-16 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      We will send a 6-digit SMS verification code to your phone.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isAnyLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-70"
                  >
                    {loadingPhone ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="otpCodeRegister"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                      >
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setErrorMessage(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Change number
                      </button>
                    </div>
                    <input
                      id="otpCodeRegister"
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full tracking-widest text-center font-mono text-xl rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 placeholder-slate-300 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <p className="mt-1.5 text-xs text-slate-500 text-center">
                      Sent to {countryCode} {phoneNumber}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isAnyLoading || otpCode.length < 6}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-70"
                  >
                    {loadingPhone ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Complete Registration</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
