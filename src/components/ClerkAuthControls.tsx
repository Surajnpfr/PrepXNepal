import React from 'react';
import { SignInButton, SignUpButton, useClerk } from '@clerk/clerk-react';
import { captureReferralCodeFromLocation } from '../lib/referralCapture';
import { Button } from './ui';

const REDIRECT = '/home';

type ClerkAuthControlsProps = {
  layout?: 'topbar';
};

/**
 * Topbar Clerk sign-in / sign-up.
 */
export const ClerkAuthControls: React.FC<ClerkAuthControlsProps> = () => {
  const onAuthIntent = () => {
    captureReferralCodeFromLocation();
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <SignInButton
        mode="modal"
        fallbackRedirectUrl={REDIRECT}
        forceRedirectUrl={REDIRECT}
        signUpFallbackRedirectUrl={REDIRECT}
        signUpForceRedirectUrl={REDIRECT}
      >
        <Button type="button" size="sm" onClick={onAuthIntent}>
          Sign In
        </Button>
      </SignInButton>
      <SignUpButton mode="modal" fallbackRedirectUrl={REDIRECT} forceRedirectUrl={REDIRECT}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={onAuthIntent}
        >
          Sign Up
        </Button>
      </SignUpButton>
    </div>
  );
};

type LandingSignInProps = {
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

const LANDING_DESKTOP_CLASS =
  'px-4 py-2 text-[14px] font-medium text-[#53647C] hover:text-[#0F172A] hover:bg-white/60 rounded-full transition-all cursor-pointer';

const LANDING_MOBILE_CLASS =
  'w-full py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer';

/**
 * Landing "Sign In" — always opens Clerk modal.
 * Uses openSignIn() so it cannot accidentally call onEnterApp / guest dashboard.
 */
export const LandingSignInButton: React.FC<LandingSignInProps> = ({
  className,
  fullWidth = false,
  children = 'Sign In',
}) => {
  const { openSignIn } = useClerk();

  return (
    <button
      type="button"
      className={className || (fullWidth ? LANDING_MOBILE_CLASS : LANDING_DESKTOP_CLASS)}
      onClick={() => {
        captureReferralCodeFromLocation();
        void openSignIn({
          fallbackRedirectUrl: REDIRECT,
          forceRedirectUrl: REDIRECT,
          signUpFallbackRedirectUrl: REDIRECT,
          signUpForceRedirectUrl: REDIRECT,
        });
      }}
    >
      {children}
    </button>
  );
};
