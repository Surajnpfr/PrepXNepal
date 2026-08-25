/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ClerkProvider} from '@clerk/clerk-react';
import App from './App.tsx';
import { FeedbackProvider } from './components/FeedbackProvider';
import { LandingAuthProvider } from './components/ClerkAuthControls';
import { CLERK_SOFT_REDIRECT, clerkAppearance } from './lib/clerkUi';
import './index.css';
import 'katex/dist/katex.min.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl={CLERK_SOFT_REDIRECT.fallbackRedirectUrl}
      signUpFallbackRedirectUrl={CLERK_SOFT_REDIRECT.signUpFallbackRedirectUrl}
      afterSignOutUrl="/"
      appearance={clerkAppearance as never}
    >
      <FeedbackProvider>
        <LandingAuthProvider>
          <App />
        </LandingAuthProvider>
      </FeedbackProvider>
    </ClerkProvider>
  </StrictMode>,
);
