import React, { useCallback } from 'react';
import { SignInButton, SignUpButton, useClerk } from '@clerk/clerk-react';
import { captureReferralCodeFromLocation } from '../lib/referralCapture';
import { Button } from './ui';

const REDIRECT = '/home';

const CLERK_REDIRECT = {
  fallbackRedirectUrl: REDIRECT,
  forceRedirectUrl: REDIRECT,
  signUpFallbackRedirectUrl: REDIRECT,
  signUpForceRedirectUrl: REDIRECT,
} as const;

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

type LandingAuthButtonProps = {
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

const LANDING_DESKTOP_CLASS =
  'px-4 py-2 text-[14px] font-medium text-[#53647C] hover:text-[#0F172A] hover:bg-white/60 rounded-full transition-all cursor-pointer';

const LANDING_MOBILE_CLASS =
  'w-full py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer';

const LANDING_SIGNUP_DESKTOP_CLASS =
  'px-4 py-2 bg-[#2563EB]/90 hover:bg-[#2563EB] text-white font-semibold text-[14px] rounded-[14px] transition-all cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.25)] border-t border-white/40 border-x border-b border-white/10 hover:-translate-y-0.5 active:translate-y-0';

const LANDING_SIGNUP_MOBILE_CLASS =
  'w-full py-2.5 text-sm font-medium text-white bg-[#2563EB] rounded-lg cursor-pointer';

/** Shared landing auth openers (Sign In / Sign Up modals). */
export function useLandingAuthModals() {
  const { openSignIn, openSignUp } = useClerk();

  const promptSignIn = useCallback(() => {
    captureReferralCodeFromLocation();
    void openSignIn({ ...CLERK_REDIRECT });
  }, [openSignIn]);

  const promptSignUp = useCallback(() => {
    captureReferralCodeFromLocation();
    void openSignUp({
      fallbackRedirectUrl: REDIRECT,
      forceRedirectUrl: REDIRECT,
    });
  }, [openSignUp]);

  return { promptSignIn, promptSignUp };
}

/**
 * Landing "Sign In" — always opens Clerk modal.
 * Uses openSignIn() so it cannot accidentally enter the guest dashboard.
 */
export const LandingSignInButton: React.FC<LandingAuthButtonProps> = ({
  className,
  fullWidth = false,
  children = 'Sign In',
}) => {
  const { promptSignIn } = useLandingAuthModals();

  return (
    <button
      type="button"
      className={className || (fullWidth ? LANDING_MOBILE_CLASS : LANDING_DESKTOP_CLASS)}
      onClick={promptSignIn}
    >
      {children}
    </button>
  );
};

/**
 * Landing "Sign Up" — opens Clerk sign-up modal (used by nav + referral links).
 */
export const LandingSignUpButton: React.FC<LandingAuthButtonProps> = ({
  className,
  fullWidth = false,
  children = 'Sign Up',
}) => {
  const { promptSignUp } = useLandingAuthModals();

  return (
    <button
      type="button"
      className={
        className || (fullWidth ? LANDING_SIGNUP_MOBILE_CLASS : LANDING_SIGNUP_DESKTOP_CLASS)
      }
      onClick={promptSignUp}
    >
      {children}
    </button>
  );
};
