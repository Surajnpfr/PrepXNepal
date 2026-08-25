import React, { useEffect, useState } from 'react';
import { useAuth, useClerk, useSignUp } from '@clerk/clerk-react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import {
  HEARD_ABOUT_US_OPTIONS,
  type HeardAboutUs,
} from '../lib/heardAboutUs';
import { CLERK_AFTER_AUTH_PATH } from '../lib/clerkUi';
import { BrandLogo } from './BrandLogo';
import { AppIcon } from './ui';

type CustomSignUpPageProps = {
  onBackToWelcome: () => void;
  onSignedIn: () => void;
};

function clerkErrorMessage(err: unknown, fallback: string): string {
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
  const first = e?.errors?.[0];
  return first?.longMessage || first?.message || e?.message || fallback;
}

/**
 * Custom PrepX sign-up page — attribution lives on the same form as email/password/OTP.
 */
export const CustomSignUpPage: React.FC<CustomSignUpPageProps> = ({
  onBackToWelcome,
  onSignedIn,
}) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const [heardAboutUs, setHeardAboutUs] = useState<HeardAboutUs | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) onSignedIn();
  }, [isSignedIn, onSignedIn]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (!heardAboutUs) {
      setError('Please tell us how you heard about PrepX Nepal.');
      return;
    }
    if (!emailAddress.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        unsafeMetadata: { heardAboutUs },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setError(clerkErrorMessage(err, 'Could not start sign-up. Check your details and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (!code.trim()) {
      setError('Enter the verification code from your email.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        onSignedIn();
        return;
      }

      setError('Verification incomplete. Try the code again or restart sign-up.');
    } catch (err) {
      setError(clerkErrorMessage(err, 'Invalid or expired code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.12),transparent)] text-slate-900 flex flex-col font-sans">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={onBackToWelcome}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <AppIcon icon={ArrowLeft} size="btn" />
          Welcome
        </button>
        <a href="/" className="inline-flex items-center gap-2 font-bold tracking-tight text-slate-900">
          <BrandLogo size={28} decorative />
          PrepX <span className="text-[#2563EB]">Nepal</span>
        </a>
        <button
          type="button"
          onClick={() => void openSignIn({ fallbackRedirectUrl: CLERK_AFTER_AUTH_PATH })}
          className="text-sm font-semibold text-[#2563EB] hover:text-blue-700 cursor-pointer"
        >
          Sign In
        </button>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-10">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-[0_16px_48px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="px-5 sm:px-7 pt-6 pb-4 border-b border-slate-100 space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500">
              {pendingVerification
                ? 'Enter the email code we sent you to finish signing up.'
                : 'Tell us how you found us, then create your PrepX Nepal account.'}
            </p>
          </div>

          <div className="px-5 sm:px-7 py-5 space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-800">
                {error}
              </div>
            )}

            {!pendingVerification ? (
              <form onSubmit={(e) => void handleCreate(e)} className="space-y-5">
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/80 p-4 space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                      How did you hear about us?{' '}
                      <span className="text-rose-500" aria-hidden>
                        *
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Required — pick one before creating your account.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {HEARD_ABOUT_US_OPTIONS.map((opt) => {
                      const active = heardAboutUs === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setHeardAboutUs(opt.value);
                            setError(null);
                          }}
                          className={[
                            'text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer',
                            active
                              ? 'border-blue-600 bg-white ring-2 ring-blue-600/20 shadow-xs'
                              : 'border-slate-200 bg-white/80 hover:border-blue-300 hover:bg-white',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.accent}`}
                              aria-hidden
                            />
                            <span className="text-[13px] font-bold text-slate-900">{opt.label}</span>
                          </div>
                          <div className="pl-[18px] mt-0.5 text-[10px] text-slate-500 font-medium">
                            {opt.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {heardAboutUs ? (
                    <p className="text-[11px] font-semibold text-emerald-700">
                      Selected: {HEARD_ABOUT_US_OPTIONS.find((o) => o.value === heardAboutUs)?.label}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-xs font-bold text-slate-700">First name</span>
                    <input
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-xs font-bold text-slate-700">Last name</span>
                    <input
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </label>
                </div>

                <label className="space-y-1.5 block">
                  <span className="text-xs font-bold text-slate-700">
                    Email <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] text-slate-500">At least 8 characters.</span>
                </label>

                <button
                  type="submit"
                  disabled={busy || !isLoaded}
                  className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <AppIcon icon={Loader2} size="btn" className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900 flex items-start gap-2">
                  <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Code sent to <span className="font-bold">{emailAddress}</span>. Check your inbox
                    (and spam).
                  </span>
                </div>

                <label className="space-y-1.5 block">
                  <span className="text-xs font-bold text-slate-700">Verification code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy || !isLoaded}
                  className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <AppIcon icon={Loader2} size="btn" className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    'Verify & open dashboard'
                  )}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPendingVerification(false);
                    setCode('');
                    setError(null);
                  }}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Back to account details
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
