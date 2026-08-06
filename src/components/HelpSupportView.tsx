import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  HelpCircle,
  ShieldCheck,
  Mail,
  FileText,
  Lock,
  Coins,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bug,
  Send,
  Instagram,
  MessageSquareHeart,
  Clock,
  CheckCircle2,
  CreditCard,
  FileWarning,
  Timer,
} from 'lucide-react';
import { PoliciesView } from './PoliciesView';
import { WorkflowView } from './WorkflowView';
import { useFeedback } from './FeedbackProvider';
import { AppIcon, Select } from './ui';
import {
  fetchSupportIssues,
  submitSupportIssue,
  type SupportIssue,
  type SupportIssueCategory,
} from '../lib/supportIssuesApi';
import { LandingSignInButton } from './ClerkAuthControls';
import {
  SUPPORT_EMAIL,
  SUPPORT_INSTAGRAM_LABEL,
  SUPPORT_INSTAGRAM_URL,
  SUPPORT_MAILTO,
} from '../lib/supportContacts';
import type { HelpSubTab } from '../lib/appRoutes';

/** Action tabs first: Contact → Issue → Feedback, then FAQ & policies. */
const HELP_SECTIONS: { id: HelpSubTab; label: string }[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'issue', label: 'Report Issue' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'faq', label: 'FAQs' },
  { id: 'info', label: 'CEE Rules' },
  { id: 'workflow', label: 'Student Journey' },
  { id: 'policies', label: 'Legal SLA' },
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'coins-policy', label: 'Coins Rule' },
  { id: 'refund', label: 'Refunds' },
];

const ISSUE_CATEGORIES: {
  value: SupportIssueCategory;
  label: string;
  hint: string;
  icon: typeof Bug;
}[] = [
  {
    value: 'technical',
    label: 'App bug / timer',
    hint: 'Crashes, freezes, timer issues',
    icon: Timer,
  },
  {
    value: 'content',
    label: 'Question or explanation',
    hint: 'Wrong answer, typo, unclear stem',
    icon: FileWarning,
  },
  {
    value: 'payment',
    label: 'Payment verification',
    hint: 'Claim delay or rejection',
    icon: CreditCard,
  },
  {
    value: 'coins',
    label: 'Study Coins wallet',
    hint: 'Balance, redeem, rewards',
    icon: Coins,
  },
];

const MIN_BODY = 10;
const MAX_BODY = 4000;

const CATEGORY_LABEL: Record<SupportIssueCategory, string> = {
  technical: 'App / Timer',
  content: 'Question Content',
  payment: 'Payment Claim',
  coins: 'Study Coins',
  feedback: 'Feedback',
};

const fieldClass =
  'w-full min-h-11 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

const labelClass = 'block text-xs font-bold text-slate-700';

interface HelpSupportViewProps {
  activeSubTab: HelpSubTab;
  setActiveSubTab: (subTab: HelpSubTab) => void;
}

function headerCopy(sub: HelpSubTab): { title: string; subtitle: string } {
  if (sub === 'contact') {
    return {
      title: 'Contact PrepX Nepal',
      subtitle: 'Email or Instagram — the fastest ways to reach the PrepX team.',
    };
  }
  if (sub === 'issue') {
    return {
      title: 'Report an issue',
      subtitle: 'Bugs, wrong answers, payment delays, or wallet problems — we triage in FIFO order.',
    };
  }
  if (sub === 'feedback') {
    return {
      title: 'Share feedback',
      subtitle: 'Ideas and UX suggestions that help us improve PrepX Nepal for CEE aspirants.',
    };
  }
  return {
    title: 'Help & support',
    subtitle: 'MEC CEE rules, FAQs, policies, and how to reach PrepX Nepal.',
  };
}

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({
  activeSubTab,
  setActiveSubTab,
}) => {
  const feedback = useFeedback();
  const { isSignedIn, getToken } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [issueCategory, setIssueCategory] = useState<SupportIssueCategory>('technical');
  const [issueDetails, setIssueDetails] = useState('');
  const [issueFieldError, setIssueFieldError] = useState<string | null>(null);
  const [issueSubmitted, setIssueSubmitted] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [feedbackFieldError, setFeedbackFieldError] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [myTickets, setMyTickets] = useState<SupportIssue[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const loadMyTickets = useCallback(async () => {
    if (!isSignedIn) {
      setMyTickets([]);
      return;
    }
    setTicketsLoading(true);
    try {
      const data = await fetchSupportIssues(getToken);
      setMyTickets(data.issues);
    } catch {
      /* non-blocking — form still works */
    } finally {
      setTicketsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (activeSubTab === 'issue' || activeSubTab === 'feedback') {
      void loadMyTickets();
    }
  }, [activeSubTab, loadMyTickets]);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueFieldError(null);
    if (!isSignedIn) {
      await feedback.alert({
        variant: 'warning',
        title: 'Sign in required',
        message: 'Sign in so we can attach your account to the report and follow up.',
      });
      return;
    }
    const trimmed = issueDetails.trim();
    if (trimmed.length < MIN_BODY) {
      setIssueFieldError(`Describe the issue in at least ${MIN_BODY} characters.`);
      return;
    }
    setSubmittingIssue(true);
    try {
      await submitSupportIssue(getToken, {
        category: issueCategory,
        body: trimmed.slice(0, MAX_BODY),
      });
      setIssueSubmitted(true);
      setIssueDetails('');
      setIssueFieldError(null);
      feedback.toast({ message: 'Issue report saved. Staff will review it.', variant: 'success' });
      void loadMyTickets();
      setTimeout(() => setIssueSubmitted(false), 5000);
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Could not submit',
        message: err?.message || 'Failed to save issue report',
      });
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackFieldError(null);
    if (!isSignedIn) {
      await feedback.alert({
        variant: 'warning',
        title: 'Sign in required',
        message: 'Sign in so we can attach feedback to your account.',
      });
      return;
    }
    const trimmed = feedbackDetails.trim();
    if (trimmed.length < MIN_BODY) {
      setFeedbackFieldError(`Share at least ${MIN_BODY} characters so we can act on it.`);
      return;
    }
    setSubmittingFeedback(true);
    try {
      await submitSupportIssue(getToken, {
        category: 'feedback',
        body: trimmed.slice(0, MAX_BODY),
      });
      setFeedbackSubmitted(true);
      setFeedbackDetails('');
      setFeedbackFieldError(null);
      feedback.toast({ message: 'Thanks — your feedback was saved.', variant: 'success' });
      void loadMyTickets();
      setTimeout(() => setFeedbackSubmitted(false), 5000);
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Could not submit',
        message: err?.message || 'Failed to save feedback',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const faqs = [
    {
      q: 'How does CEE negative marking work?',
      a: 'Under Medical Education Commission (MEC) rules, each correct answer earns 1 mark and each wrong answer deducts 0.25 marks. Unanswered questions score 0. Skipping uncertain questions helps protect your total.',
    },
    {
      q: 'Can I upgrade from Standard to Premium?',
      a: 'Yes. Open Plans & payment, choose Premium, pay the difference via the merchant QR, and submit your transaction reference for verification.',
    },
    {
      q: 'How long does payment verification take?',
      a: 'Most payment claims are reviewed within about 2 hours during the day. Claims submitted late at night are usually reviewed the next morning.',
    },
    {
      q: 'Do Study Coins expire?',
      a: 'Study Coins rewards are coming soon. When the wallet launches, coins will stay in your account until you redeem them — they will not expire.',
    },
    {
      q: 'How do I report a wrong answer or typo?',
      a: 'Open Report Issue on this page, choose question or explanation error, include the mock title and question number, then submit. Our team will review it.',
    },
  ];

  const { title, subtitle } = headerCopy(activeSubTab);
  const headerIcon =
    activeSubTab === 'contact'
      ? Mail
      : activeSubTab === 'issue'
        ? Bug
        : activeSubTab === 'feedback'
          ? MessageSquareHeart
          : HelpCircle;

  const issueTickets = myTickets.filter((t) => t.category !== 'feedback');
  const feedbackTickets = myTickets.filter((t) => t.category === 'feedback');

  const renderTicketList = (items: SupportIssue[], emptyLabel: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Your recent submissions</h3>
        {ticketsLoading && (
          <span className="text-[11px] text-slate-500 font-medium">Refreshing…</span>
        )}
      </div>
      {items.length === 0 && !ticketsLoading ? (
        <p className="text-xs text-slate-500 py-2">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 8).map((ticket) => (
            <li
              key={ticket.id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 space-y-1.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-bold uppercase tracking-wide text-slate-500">
                  {CATEGORY_LABEL[ticket.category]}
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                    ticket.status === 'open'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <AppIcon
                    icon={ticket.status === 'open' ? Clock : CheckCircle2}
                    size="btn"
                  />
                  {ticket.status}
                </span>
                <span className="font-mono text-slate-400 ml-auto">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">{ticket.body}</p>
              {ticket.staffNotes ? (
                <p className="text-[11px] text-slate-500">
                  Staff note: <span className="text-slate-700 font-medium">{ticket.staffNotes}</span>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AppIcon icon={headerIcon} size="lg" className="text-[#2563EB]" />
            <span>{title}</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">{subtitle}</p>
        </div>

        <label className="block md:hidden space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Section
          </span>
          <Select
            value={activeSubTab}
            onChange={(e) => setActiveSubTab(e.target.value as HelpSubTab)}
            aria-label="Help section"
          >
            {HELP_SECTIONS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </Select>
        </label>

        <div
          className="hidden md:block -mx-1 px-1"
          role="tablist"
          aria-label="Help sections"
        >
          <div className="scroll-x-safe flex flex-nowrap gap-1.5 overflow-x-auto pb-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {HELP_SECTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeSubTab === tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2.5 min-h-10 rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0 text-xs font-bold ${
                  activeSubTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSubTab === 'contact' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">Get in touch</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                For payment verification, mock errors, or account help, use email or Instagram.
                We reply from Kathmandu during daytime hours.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={SUPPORT_MAILTO}
                className="inline-flex items-center justify-center gap-2 min-h-12 px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition-colors"
              >
                <AppIcon icon={Mail} size="btn" />
                <span>Email {SUPPORT_EMAIL}</span>
              </a>
              <a
                href={SUPPORT_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-12 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors"
              >
                <AppIcon icon={Instagram} size="btn" />
                <span>Instagram {SUPPORT_INSTAGRAM_LABEL}</span>
              </a>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Prefer self-serve? Check{' '}
              <button
                type="button"
                onClick={() => setActiveSubTab('faq')}
                className="text-blue-700 font-semibold underline underline-offset-2 cursor-pointer"
              >
                FAQs
              </button>
              ,{' '}
              <button
                type="button"
                onClick={() => setActiveSubTab('issue')}
                className="text-blue-700 font-semibold underline underline-offset-2 cursor-pointer"
              >
                report an issue
              </button>
              , or{' '}
              <button
                type="button"
                onClick={() => setActiveSubTab('feedback')}
                className="text-blue-700 font-semibold underline underline-offset-2 cursor-pointer"
              >
                share feedback
              </button>
              .
            </p>
          </div>
        </div>
      )}

      {activeSubTab === 'issue' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="space-y-1.5 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon icon={Bug} size="card" className="text-blue-600" />
                <span>Technical or content issue</span>
              </h2>
              <p className="text-sm text-slate-600">
                Include mock title, question number, or payment reference so staff can investigate quickly.
              </p>
            </div>

            {issueSubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-xl flex items-start gap-2">
                <AppIcon icon={ShieldCheck} size="card" className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Issue submitted</span>
                  <span className="text-xs">Our desk usually reviews within 24 hours.</span>
                </div>
              </div>
            )}

            {!isSignedIn ? (
              <div className="space-y-3 text-sm text-slate-600">
                <p className="font-medium">
                  Sign in to submit a report — we attach it to your account for follow-up.
                </p>
                <LandingSignInButton className="w-full min-h-11 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer" />
              </div>
            ) : (
              <form onSubmit={handleIssueSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <span id="issue-category-label" className={labelClass}>
                    Category
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="issue-category-label"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {ISSUE_CATEGORIES.map((opt) => {
                      const selected = issueCategory === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setIssueCategory(opt.value)}
                          className={`text-left min-h-11 rounded-xl border px-3.5 py-3 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 ${
                            selected
                              ? 'border-blue-600 bg-blue-50 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                selected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <AppIcon icon={opt.icon} size="btn" />
                            </span>
                            <span className="min-w-0 space-y-0.5">
                              <span
                                className={`block text-sm font-bold ${
                                  selected ? 'text-blue-900' : 'text-slate-900'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <span className="block text-[11px] text-slate-500 leading-snug">
                                {opt.hint}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="issue-details" className={labelClass}>
                    Description *
                  </label>
                  <textarea
                    id="issue-details"
                    required
                    rows={5}
                    maxLength={MAX_BODY}
                    value={issueDetails}
                    onChange={(e) => {
                      setIssueDetails(e.target.value);
                      if (issueFieldError) setIssueFieldError(null);
                    }}
                    placeholder="What went wrong? Add mock title, Q#, or payment reference ID…"
                    className={`${fieldClass} min-h-[120px] resize-y ${
                      issueFieldError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
                    }`}
                    aria-invalid={Boolean(issueFieldError)}
                    aria-describedby={issueFieldError ? 'issue-details-error' : 'issue-details-hint'}
                  />
                  <div className="flex items-start justify-between gap-3 text-[11px]">
                    {issueFieldError ? (
                      <p id="issue-details-error" className="text-rose-600 font-semibold">
                        {issueFieldError}
                      </p>
                    ) : (
                      <p id="issue-details-hint" className="text-slate-500">
                        Minimum {MIN_BODY} characters.
                      </p>
                    )}
                    <span className="font-mono text-slate-400 shrink-0">
                      {issueDetails.trim().length}/{MAX_BODY}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="w-full min-h-11 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AppIcon icon={Send} size="btn" />
                  <span>{submittingIssue ? 'Submitting…' : 'Submit issue report'}</span>
                </button>
              </form>
            )}
          </div>

          {isSignedIn && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              {renderTicketList(issueTickets, 'No issue reports yet.')}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'feedback' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="space-y-1.5 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon icon={MessageSquareHeart} size="card" className="text-blue-600" />
                <span>Product feedback</span>
              </h2>
              <p className="text-sm text-slate-600">
                Tell us what would make mocks, reports, or study tools clearer. Bugs and payment problems belong in{' '}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('issue')}
                  className="text-blue-700 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Report Issue
                </button>
                .
              </p>
            </div>

            {feedbackSubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-xl flex items-start gap-2">
                <AppIcon icon={ShieldCheck} size="card" className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Feedback received</span>
                  <span className="text-xs">Thanks — we read every submission.</span>
                </div>
              </div>
            )}

            {!isSignedIn ? (
              <div className="space-y-3 text-sm text-slate-600">
                <p className="font-medium">Sign in to send feedback tied to your account.</p>
                <LandingSignInButton className="w-full min-h-11 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer" />
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="feedback-details" className={labelClass}>
                    Your idea or suggestion *
                  </label>
                  <textarea
                    id="feedback-details"
                    required
                    rows={5}
                    maxLength={MAX_BODY}
                    value={feedbackDetails}
                    onChange={(e) => {
                      setFeedbackDetails(e.target.value);
                      if (feedbackFieldError) setFeedbackFieldError(null);
                    }}
                    placeholder="What should we improve? Which screen or flow felt confusing?"
                    className={`${fieldClass} min-h-[120px] resize-y ${
                      feedbackFieldError
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : ''
                    }`}
                    aria-invalid={Boolean(feedbackFieldError)}
                    aria-describedby={
                      feedbackFieldError ? 'feedback-details-error' : 'feedback-details-hint'
                    }
                  />
                  <div className="flex items-start justify-between gap-3 text-[11px]">
                    {feedbackFieldError ? (
                      <p id="feedback-details-error" className="text-rose-600 font-semibold">
                        {feedbackFieldError}
                      </p>
                    ) : (
                      <p id="feedback-details-hint" className="text-slate-500">
                        Minimum {MIN_BODY} characters.
                      </p>
                    )}
                    <span className="font-mono text-slate-400 shrink-0">
                      {feedbackDetails.trim().length}/{MAX_BODY}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full min-h-11 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AppIcon icon={Send} size="btn" />
                  <span>{submittingFeedback ? 'Submitting…' : 'Send feedback'}</span>
                </button>
              </form>
            )}
          </div>

          {isSignedIn && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              {renderTicketList(feedbackTickets, 'No feedback submitted yet.')}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'info' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <AppIcon icon={ShieldCheck} size="btn" className="text-emerald-600" />
                <span>MEC CEE 2026 Exam Structure & Rules</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700 font-semibold list-none pl-0">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Total Questions:</strong> 200 Multiple Choice Questions (MCQs)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Duration:</strong> 3 Hours (180 Minutes)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Correct Answer:</strong> +1.0 Mark
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Negative Marking:</strong> -0.25 Mark per wrong answer (25% penalty)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Unanswered Question:</strong> 0 Marks (No penalty)
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <AppIcon icon={FileText} size="btn" className="text-[#2563EB]" />
                <span>CEE Subject / Unit Blueprint (200 Qs)</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Physics</span>
                  <span className="font-black text-slate-900 text-sm">50 Questions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Chemistry</span>
                  <span className="font-black text-slate-900 text-sm">50 Questions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Zoology</span>
                  <span className="font-black text-slate-900 text-sm">40 Questions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Botany</span>
                  <span className="font-black text-slate-900 text-sm">40 Questions</span>
                </div>
                <div className="p-3 bg-blue-50 col-span-2 rounded-xl border border-blue-200">
                  <span className="text-blue-600 text-[10px] uppercase block">
                    MAT (Mental Ability Test)
                  </span>
                  <span className="font-black text-blue-900 text-sm">20 Questions</span>
                </div>
              </div>
              <div className="scroll-x-safe max-h-56 overflow-y-auto border border-slate-100 rounded-xl text-[11px]">
                <table className="w-full text-left min-w-[280px]">
                  <thead className="bg-slate-50 sticky top-0 text-slate-500 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Subject → Unit</th>
                      <th className="px-3 py-2 text-right">Qs / Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {[
                      ['Zoology', 'Human Biology & Physiology', 15],
                      ['Zoology', 'Study of Selected Animals', 6],
                      ['Zoology', 'Animal Diversity & Classification', 4],
                      ['Zoology', 'Microbial Diseases & Immunology', 4],
                      ['Zoology', 'Animal Tissues & Histology', 4],
                      ['Zoology', 'Evolutionary Biology', 3],
                      ['Zoology', 'Medical Technology & Applied Biology', 2],
                      ['Zoology', 'Biota, Environment & Conservation', 2],
                      ['Botany', 'Biodiversity', 9],
                      ['Botany', 'Genetics', 6],
                      ['Botany', 'Plant Physiology', 6],
                      ['Botany', 'Cell Biology', 5],
                      ['Botany', 'Ecology & Vegetation', 4],
                      ['Botany', 'Plant Anatomy', 3],
                      ['Botany', 'Applied Botany', 3],
                      ['Botany', 'Developmental Botany', 2],
                      ['Botany', 'Basic Components of Life', 2],
                      ['Chemistry', 'Physical Chemistry', 17],
                      ['Chemistry', 'Organic Chemistry', 17],
                      ['Chemistry', 'Inorganic Chemistry', 10],
                      ['Chemistry', 'Applied Chemistry', 3],
                      ['Chemistry', 'Analytical Chemistry', 3],
                      ['Physics', 'Modern Physics', 12],
                      ['Physics', 'Mechanics', 10],
                      ['Physics', 'Current Electricity & Magnetism', 9],
                      ['Physics', 'Wave and Optics', 8],
                      ['Physics', 'Heat & Thermodynamics', 7],
                      ['Physics', 'Electrostatics & Capacitors', 4],
                      ['MAT', 'All Subsections', 20],
                    ].map(([subj, unit, n]) => (
                      <tr key={`${subj}-${unit}`}>
                        <td className="px-3 py-1.5">
                          {subj} → {unit}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold">{n as number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'workflow' && <WorkflowView />}

      {activeSubTab === 'policies' && <PoliciesView />}

      {activeSubTab === 'faq' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <AppIcon icon={HelpCircle} size="card" className="text-blue-600" />
            <span>Frequently asked questions</span>
          </h2>
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer gap-3"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <AppIcon icon={ChevronUp} size="btn" className="text-slate-400 shrink-0" />
                  ) : (
                    <AppIcon icon={ChevronDown} size="btn" className="text-slate-400 shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <p className="text-sm text-slate-600 leading-relaxed pl-0.5">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'terms' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-sm text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <AppIcon icon={FileText} size="btn" className="text-blue-600" />
            <span>Terms of Service Agreement</span>
          </h2>
          <p>
            Welcome to PrepX Nepal. By signing in, starting mock tests, or purchasing a plan, you
            agree to these Terms of Service.
          </p>
          <div className="space-y-3 pt-2 font-semibold">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">1. Non-Sharing of Credentials</span>
              <span>
                Each subscription and mock allowance is tied to a single user profile. Sharing login
                details or bulk-exporting question text violates our fair-use terms.
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">
                2. Timer Integrity & Attempt Lockouts
              </span>
              <span>
                All mock test attempts represent a synchronized mock exam window. Intentionally
                manipulating browser clocks or reloading pages repeatedly to extend duration
                constitutes test manipulation.
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">3. Platform Services & Changes</span>
              <span>
                PrepX Nepal reserves the right to modify pricing tiers, update question keys based on
                medical curriculum feedback, and adjust coin rewards algorithms dynamically.
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">
                4. Subscription validity (CEE 2026)
              </span>
              <span>
                Paid Standard and Premium plans are valid until CEE 2026 finishes (through Kartik
                2026). Access and unused mock credits apply only within that season window. Free
                plan demo access is not season-bound. Validity dates may be updated when MEC
                publishes the official CEE 2026 schedule.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'privacy' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-sm text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <AppIcon icon={Lock} size="btn" className="text-blue-600" />
            <span>Privacy Policy & Data Security</span>
          </h2>
          <p>
            PrepX Nepal operates in compliance with the Privacy Act, 2075 of Nepal. We are committed
            to data minimization and protecting student credentials.
          </p>
          <div className="space-y-3 pt-2 font-semibold text-slate-600">
            <p>
              <strong>Data Collection:</strong> We collect only your name, email, target score, and
              answers selection data required to build reports. We do not inspect other local files or
              tracking cookies.
            </p>
            <p>
              <strong>Authentication security:</strong> Sign-in is handled by our secure
              authentication partner. We do not store your password.
            </p>
            <p>
              <strong>Transaction Safety:</strong> eSewa/Khalti verification records (Reference ID
              logs) are kept securely in our transaction claims table and audited purely to approve
              subscriptions.
            </p>
          </div>
        </div>
      )}

      {activeSubTab === 'coins-policy' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-sm text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <AppIcon icon={Coins} size="btn" className="text-amber-500" />
            <span>Study Coins policy</span>
          </h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest">
            Coming soon
          </div>
          <p>
            Study Coins are practice tokens that will encourage consistent study. They will have no
            cash value and cannot be withdrawn as NPR.
          </p>
          <p className="text-slate-600">
            Earn rules, redemptions, and the wallet catalog are paused while we redesign the rewards
            system. When Study Coins launch, this page will list the official earning and redemption
            policy.
          </p>
          <p className="text-xs text-slate-500">
            Open <strong>Study Coins</strong> in the app for the Coming soon notice.
          </p>
        </div>
      )}

      {activeSubTab === 'refund' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-sm text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <AppIcon icon={RefreshCw} size="btn" className="text-blue-600" />
            <span>Refund & Claims Policy</span>
          </h2>
          <p>Please read our payment claim policies before scanning eSewa or Khalti QR codes.</p>
          <div className="space-y-3 pt-2 font-semibold">
            <p>
              <strong>Payment review:</strong> Claims are checked against your transaction reference.
              Once approved, your Standard or Premium plan benefits are activated and remain valid
              until CEE 2026 finishes (through Kartik 2026).
            </p>
            <p>
              <strong>Refund Eligibility:</strong> Because mock credentials can be consumed
              immediately, plan purchases are generally non-refundable once approved and credits are
              credited.
            </p>
            <p>
              <strong>Duplicate Payments:</strong> If you submit a duplicate verification claim or
              make a double payment, our moderators will verify the duplicate Reference IDs and refund
              or adjust credits within 3 business days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
