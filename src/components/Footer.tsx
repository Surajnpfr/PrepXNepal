import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { AppIcon } from './ui';

interface FooterProps {
  onNavigate: (tab: string, subTab?: string) => void;
}

type FooterLink = { label: string; tab: string; subTab?: string; tone?: 'danger' };

const PREPARE_LINKS: FooterLink[] = [
  { label: 'Nepal CEE Rules', tab: 'policies', subTab: 'info' },
  { label: 'Mock Tests', tab: 'catalog' },
  { label: 'Previous Year Papers', tab: 'catalog' },
  { label: 'Formula Library', tab: 'formulas' },
  { label: 'Study Planner', tab: 'planner' },
];

const EXPLORE_LINKS: FooterLink[] = [
  { label: 'Dashboard', tab: 'home' },
  { label: 'Performance Reports', tab: 'reports' },
  { label: 'Saved Questions', tab: 'saved' },
  { label: 'Study Coins Wallet', tab: 'coins' },
  { label: 'Subscription Pricing', tab: 'payment' },
];

const HELP_LINKS: FooterLink[] = [
  { label: 'Help Centre', tab: 'policies', subTab: 'info' },
  { label: 'Contact', tab: 'policies', subTab: 'contact' },
  { label: 'Frequently Asked Questions', tab: 'policies', subTab: 'faq' },
  { label: 'Payment Reference Claim', tab: 'payment' },
  { label: 'Report a Problem', tab: 'policies', subTab: 'issue', tone: 'danger' },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Terms of Service', tab: 'policies', subTab: 'terms' },
  { label: 'Privacy Policy', tab: 'policies', subTab: 'privacy' },
  { label: 'Study Coins Policy', tab: 'policies', subTab: 'coins-policy' },
  { label: 'Refund Policy', tab: 'policies', subTab: 'refund' },
];

function LinkButton({
  item,
  onNavigate,
}: {
  item: FooterLink;
  onNavigate: FooterProps['onNavigate'];
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.tab, item.subTab)}
      className={`w-full text-left transition-colors cursor-pointer hover:text-[var(--px-primary)] ${
        item.tone === 'danger'
          ? 'text-rose-600 font-semibold hover:text-rose-700'
          : 'text-[var(--px-muted)]'
      }`}
    >
      {item.label}
    </button>
  );
}

function FooterSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[var(--px-border)] pt-4 md:border-t-0 md:pt-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between md:pointer-events-none text-left py-1"
        aria-expanded={open}
      >
        <h4 className="font-bold text-[var(--px-heading)] text-[13px] sm:text-sm tracking-tight">
          {title}
        </h4>
        <span className="md:hidden text-[var(--px-muted)] inline-flex items-center" aria-hidden>
          <AppIcon icon={open ? ChevronUp : ChevronDown} size="btn" />
        </span>
      </button>
      <div className={`pt-3 md:block ${open ? 'block' : 'hidden md:block'}`}>{children}</div>
    </div>
  );
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <footer className="mt-12 relative border-t border-[var(--px-border)] bg-[var(--px-surface-muted)] text-[var(--px-body)] font-sans">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-8 lg:gap-x-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <BrandLogo size={32} decorative className="shrink-0" />
              <div className="min-w-0">
                <span className="font-display font-extrabold text-[var(--px-heading)] text-base tracking-tight block leading-none">
                  PrepX Nepal
                </span>
                <span className="text-[11px] text-[var(--px-primary)] font-bold">
                  Prepare smarter. Improve faster.
                </span>
              </div>
            </div>

            <p className="text-[var(--px-muted)] text-[13px] leading-relaxed max-w-[28ch]">
              Personalized mock tests, chapter-level analytics, and focused revision tools for Nepal
              CEE preparation.
            </p>

            <p className="text-[11px] text-[var(--px-muted)] font-medium flex items-start gap-2 max-w-[32ch]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--px-success)] shrink-0" />
              <span>Built for students preparing for competitive entrance exams in Nepal.</span>
            </p>
          </div>

          {/* Prepare */}
          <div className="lg:col-span-2">
            <FooterSection
              id="prepare"
              title="Prepare"
              open={openSection === 'prepare'}
              onToggle={toggleSection}
            >
              <ul className="space-y-2.5 text-[13px] font-medium list-none pl-0 m-0">
                {PREPARE_LINKS.map((item) => (
                  <li key={item.label}>
                    <LinkButton item={item} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </FooterSection>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <FooterSection
              id="explore"
              title="Explore"
              open={openSection === 'explore'}
              onToggle={toggleSection}
            >
              <ul className="space-y-2.5 text-[13px] font-medium list-none pl-0 m-0">
                {EXPLORE_LINKS.map((item) => (
                  <li key={item.label}>
                    <LinkButton item={item} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </FooterSection>
          </div>

          {/* Help */}
          <div className="lg:col-span-4 space-y-4">
            <FooterSection
              id="help"
              title="Help"
              open={openSection === 'help'}
              onToggle={toggleSection}
            >
              <div className="space-y-4">
                <p className="text-[var(--px-muted)] text-[13px] leading-snug max-w-[36ch]">
                  Need help with subscriptions, CEE marks, or payment verification?
                </p>

                <button
                  type="button"
                  onClick={() => onNavigate('policies', 'contact')}
                  className="h-11 px-4 w-full sm:w-auto min-w-[200px] bg-[var(--px-primary)] hover:opacity-90 text-white font-bold text-[13px] rounded-[14px] shadow-[var(--px-shadow)] inline-flex items-center justify-center gap-2 transition-opacity cursor-pointer"
                >
                  <AppIcon icon={HelpCircle} size="btn" className="text-white/90" />
                  <span>Contact Support</span>
                </button>

                <ul className="space-y-2.5 text-[13px] font-medium list-none pl-0 m-0">
                  {HELP_LINKS.map((item) => (
                    <li key={item.label}>
                      <LinkButton item={item} onNavigate={onNavigate} />
                    </li>
                  ))}
                </ul>
              </div>
            </FooterSection>
          </div>
        </div>
      </div>

      {/* Legal bar — single place for policies */}
      <div className="border-t border-[var(--px-border)] bg-[var(--px-surface)]/70 py-3.5 px-4 sm:px-6">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px] text-[var(--px-muted)] font-medium">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-center sm:text-left">
            <span>© 2026 PrepX Nepal. All rights reserved.</span>
            <span className="hidden sm:inline opacity-50" aria-hidden>
              ·
            </span>
            <span className="text-[11px] font-mono opacity-70">Platform v1.0</span>
          </div>

          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          >
            {LEGAL_LINKS.map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 ? (
                  <span className="text-[var(--px-border)] select-none" aria-hidden>
                    ·
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onNavigate(item.tab, item.subTab)}
                  className="hover:text-[var(--px-primary)] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};
