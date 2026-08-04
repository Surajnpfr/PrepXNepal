/**
 * Clerk UI / post-auth navigation — soft redirects only (no forceRedirect).
 * App owns SPA entry to /home after sign-in so OTP modals are not remounted.
 */

export const CLERK_AFTER_AUTH_PATH = '/home';

/** Soft redirects only — never forceRedirect* (causes OTP modal refresh). */
export const CLERK_SOFT_REDIRECT = {
  fallbackRedirectUrl: CLERK_AFTER_AUTH_PATH,
  signUpFallbackRedirectUrl: CLERK_AFTER_AUTH_PATH,
} as const;

/** PrepX brand tokens for Clerk modal (above BrainLanding z-[100]). */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#2563EB',
    colorText: '#0F172A',
    colorTextSecondary: '#53647C',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#F8FAFC',
    colorInputText: '#0F172A',
    borderRadius: '0.875rem',
    fontFamily: 'Manrope, Inter, system-ui, sans-serif',
  },
  elements: {
    rootBox: {
      zIndex: '300',
    },
    modalBackdrop: {
      zIndex: '300',
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
    },
    modalContent: {
      zIndex: '301',
      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
    },
    card: {
      borderRadius: '1rem',
      border: '1px solid #E2E8F0',
      boxShadow: '0 10px 40px rgba(15, 23, 42, 0.12)',
    },
    headerTitle: {
      fontWeight: '700',
      color: '#0F172A',
    },
    headerSubtitle: {
      color: '#53647C',
    },
    formButtonPrimary: {
      backgroundColor: '#2563EB',
      borderRadius: '0.75rem',
      fontWeight: '600',
      '&:hover': {
        backgroundColor: '#1D4ED8',
      },
    },
    footerActionLink: {
      color: '#2563EB',
      fontWeight: '600',
    },
    identityPreviewEditButton: {
      color: '#2563EB',
    },
    formFieldInput: {
      borderRadius: '0.75rem',
      borderColor: '#E2E8F0',
    },
    otpCodeFieldInput: {
      borderRadius: '0.5rem',
      borderColor: '#E2E8F0',
    },
  },
} as const;
