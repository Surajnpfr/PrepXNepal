import React from 'react';
import { useAuth } from '@clerk/clerk-react';

interface ShowProps {
  when: 'signed-in' | 'signed-out';
  children: React.ReactNode;
}

export const Show: React.FC<ShowProps> = ({ when, children }) => {
  const { isSignedIn } = useAuth();
  const showContent = (when === 'signed-in' && isSignedIn) || (when === 'signed-out' && !isSignedIn);
  return showContent ? <>{children}</> : null;
};
