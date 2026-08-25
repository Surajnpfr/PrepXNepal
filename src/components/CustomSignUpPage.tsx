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

type VerifyChannel = 'email' | 'phone';

function clerkErrorMessage(err: unknown, fallback: string): string {
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
  const first = e?.errors?.[0];
  return first?.longMessage || first?.message || e?.message || fallback;
}

/** Normalize Nepal / international phone input to E.164. */
function toE164Phone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  // Nepal mobile: 10 digits starting 97/98 → +977…
  if (digits.length === 10 && /^9[78]\d{8}$/.test(digits)) {
    return `+977${digits}`;
  }
  if (digits.startsWith('977') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

function isValidUsername(raw: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(raw.trim());
}

/**
 * Custom PrepX sign-up — account fields first, “How did you hear about us?” last.
 */
export const CustomSignUpPage: React.FC<CustomSignUpPageProps> = ({
  onBackToWelcome,
  onSignedIn,
}) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [heardAboutUs, setHeardAboutUs] = useState<HeardAboutUs | null>(null);
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifyChannel, setVerifyChannel] = useState<VerifyChannel>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) onSignedIn();
  }, [isSignedIn, onSignedIn]);

  const finishIfComplete = async (status: string | null | undefined, sessionId: string | null | undefined) => {
    if (status === 'complete' && sessionId) {
      await setActive({ session: sessionId });
      onSignedIn();
      return true;
    }
    return false;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    const user = username.trim();
    const email = emailAddress.trim();
    const phoneRaw = phoneNumber.trim();
    const phoneE164 = phoneRaw ? toE164Phone(phoneRaw) : null;

    if (!user || !isValidUsername(user)) {
      setError('Username must be 3–30 characters (letters, numbers, underscore).');
      return;
    }
    // Phone is optional (not required for login); if filled, it must be valid.
    if (phoneRaw && !phoneE164) {
      setError('Enter a valid phone number (e.g. 98XXXXXXXX or +97798XXXXXXXX), or leave it blank.');
      return;
    }
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!heardAboutUs) {
      setError('Please tell us how you heard about PrepX Nepal.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const created = await signUp.create({
        emailAddress: email,
        password,
        username: user,
        ...(phoneE164 ? { phoneNumber: phoneE164 } : {}),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        unsafeMetadata: {
          heardAboutUs,
          ...(phoneRaw ? { phoneLocal: phoneRaw } : {}),
        },
      });

      if (await finishIfComplete(created.status, created.createdSessionId)) return;

      // Prefer email OTP. Phone verify only if user provided a number and Clerk still needs it.
      const emailStatus = created.verifications?.emailAddress?.status;
      const phoneStatus = created.verifications?.phoneNumber?.status;

      if (emailStatus !== 'verified') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setVerifyChannel('email');
        setPendingVerification(true);
        return;
      }

      if (phoneE164 && phoneStatus && phoneStatus !== 'verified') {
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        setVerifyChannel('phone');
        setPendingVerification(true);
        return;
      }

      setError('Account created but still incomplete. Try verifying again or contact support.');
    } catch (err) {
      const msg = clerkErrorMessage(err, 'Could not start sign-up. Check your details and try again.');
      const lower = msg.toLowerCase();
      if (lower.includes('username') && (lower.includes('not enabled') || lower.includes('disabled'))) {
        setError(
          'Username is not enabled in Clerk. Turn on Username under Clerk Dashboard → User & authentication → Email, phone, username.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (!code.trim()) {
      setError('Enter the verification code.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result =
        verifyChannel === 'phone'
          ? await signUp.attemptPhoneNumberVerification({ code: code.trim() })
          : await signUp.attemptEmailAddressVerification({ code: code.trim() });

      if (await finishIfComplete(result.status, result.createdSessionId)) return;

      // After email, only verify phone if the user provided one and Clerk still needs it.
      const phoneStatus = result.verifications?.phoneNumber?.status;
      const hasPhone = Boolean(toE164Phone(phoneNumber.trim()) || signUp.phoneNumber);
      if (
        verifyChannel === 'email' &&
        hasPhone &&
        phoneStatus &&
        phoneStatus !== 'verified'
      ) {
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        setVerifyChannel('phone');
        setCode('');
        setPendingVerification(true);
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
                ? verifyChannel === 'phone'
                  ? 'Enter the SMS code we sent to your phone.'
                  : 'Enter the email code we sent you to finish signing up.'
                : 'Fill in your details — how you found us comes last.'}
            </p>
          </div>

          <div className="px-5 sm:px-7 py-5 space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-800">
                {error}
              </div>
            )}

            {!pendingVerification ? (
              <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
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
                    Username <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    placeholder="e.g. suraj_cee"
                    minLength={3}
                    maxLength={30}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] text-slate-500">3–30 characters · letters, numbers, _</span>
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-xs font-bold text-slate-700">
                    Phone number <span className="text-slate-400 font-semibold">(optional)</span>
                  </span>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 rounded-xl border border-slate-300 bg-slate-100 text-xs font-bold text-slate-600 shrink-0">
                      +977
                    </span>
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Optional — not needed for login. Nepal mobile preferred, or paste full +…
                  </span>
                </label>

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

                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/80 p-4 space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                      How did you hear about us?{' '}
                      <span className="text-rose-500" aria-hidden>
                        *
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Last step — pick one source.
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
                    {verifyChannel === 'phone' ? (
                      <>
                        SMS code sent to <span className="font-bold">{phoneNumber || 'your phone'}</span>.
                      </>
                    ) : (
                      <>
                        Code sent to <span className="font-bold">{emailAddress}</span>. Check inbox
                        (and spam).
                      </>
                    )}
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
