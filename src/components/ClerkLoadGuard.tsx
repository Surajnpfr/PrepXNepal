import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const LOAD_TIMEOUT_MS = 10_000;

/**
 * Surfaces a clear error when Clerk Frontend API / clerk-js never becomes ready
 * (broken custom domain DNS, blocked script, wrong publishable key, etc.).
 */
export const ClerkLoadGuard: React.FC = () => {
  const { isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setTimedOut(false);
      return;
    }
    const id = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [isLoaded]);

  if (!timedOut || isLoaded) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-[100] border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      <p className="font-semibold">Sign-in is unavailable</p>
      <p className="mt-1 text-rose-800/90 text-xs leading-relaxed max-w-3xl">
        Authentication could not load from Clerk. On production this usually means the Clerk
        Frontend API host in your publishable key (custom domain) is unreachable, or{' '}
        <span className="font-mono">coffeehubnepal.com</span> is not allowed on that Clerk
        instance. Fix DNS / Clerk Domains, then rebuild with matching{' '}
        <span className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</span> and{' '}
        <span className="font-mono">CLERK_SECRET_KEY</span>.
      </p>
    </div>
  );
};
