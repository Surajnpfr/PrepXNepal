import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ArrowRight,
  BookOpen,
  Coins,
  Menu,
  X,
  FileCheck,
  LayoutDashboard,
  LineChart,
  BookMarked,
  Bell,
  Clock,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { AppIcon } from './ui';
import {
  LandingSignInButton,
  LandingSignUpButton,
  useLandingAuthModals,
} from './ClerkAuthControls';
import { captureReferralCodeFromLocation } from '../lib/referralCapture';

interface BrainLandingProps {
  /** @deprecated Guest dashboard entry is disabled; CTAs open Sign Up. */
  onEnterApp?: (initialCategory?: string) => void;
  onClose?: () => void;
}

const SCORE_TREND = [
  { mock: 'M1', score: 122 },
  { mock: 'M2', score: 128 },
  { mock: 'M3', score: 135 },
  { mock: 'M4', score: 138 },
  { mock: 'Latest', score: 142, active: true },
];

const SUBJECT_READINESS = [
  { name: 'Physics', pct: 64 },
  { name: 'Chemistry', pct: 58 },
  { name: 'Botany & Zoology', pct: 74 },
];

export const BrainLanding: React.FC<BrainLandingProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { promptSignIn, promptSignUp } = useLandingAuthModals();
  const referralSignUpOpened = useRef(false);

  // Referral links (?ref=) land on welcome and open Sign Up.
  useEffect(() => {
    if (referralSignUpOpened.current) return;
    try {
      const ref = new URLSearchParams(window.location.search).get('ref')?.trim();
      if (!ref) return;
      captureReferralCodeFromLocation();
      referralSignUpOpened.current = true;
      const id = window.setTimeout(() => promptSignUp(), 250);
      return () => window.clearTimeout(id);
    } catch {
      /* ignore */
    }
  }, [promptSignUp]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Mock Tests', id: 'split-brain-section' },
    { label: 'Resources', id: 'split-brain-section' },
    { label: 'Performance', id: 'performance-section' },
    { label: 'Study Plan', id: 'how-it-works-section' },
    { label: 'Pricing', id: 'coins-section' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#F4F7FC] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))] text-slate-900 overflow-y-auto overflow-x-hidden font-sans antialiased selection:bg-blue-100 pb-20 md:pb-0">

      {/* Header */}
      <header className="sticky top-4 z-50 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 transition-all">
        <div className="h-[70px] bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.06),0_1px_1px_rgba(255,255,255,0.8)_inset] rounded-[24px] px-5 flex items-center justify-between transition-all hover:bg-white/85">
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={scrollToTop}
          >
            <BrandLogo size={36} decorative className="shrink-0 group-hover:scale-105 transition-transform" />
            <div className="text-left">
              <span className="font-bold text-[#0F172A] text-base tracking-tight block leading-tight">
                PrepX <span className="text-[#2563EB]">Nepal</span>
              </span>
              <span className="text-[11px] text-[#53647C] font-medium tracking-wide block">
                Prepare Smarter
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/60 backdrop-blur-md rounded-full border border-white/60 text-[14px] font-medium text-[#53647C]">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="px-4 py-1.5 rounded-full hover:bg-white/90 hover:text-[#0F172A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LandingSignInButton />
            <LandingSignUpButton>
              <span className="inline-flex items-center gap-2">
                Sign Up
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <AppIcon icon={ArrowRight} size="btn" className="text-white" />
                </span>
              </span>
            </LandingSignUpButton>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#0F172A] hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <AppIcon icon={X} size="card" /> : <AppIcon icon={Menu} size="card" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/90 backdrop-blur-xl border border-white/80 rounded-[20px] shadow-[0_8px_32px_rgba(15,23,42,0.08)] py-3 px-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-900 rounded-lg hover:bg-slate-100"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col gap-2">
              <LandingSignInButton fullWidth />
              <LandingSignUpButton fullWidth />
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-10 pb-10 lg:pt-14 lg:pb-12 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Nepal CEE 2026
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Prepare for Nepal CEE with timed mocks and chapter reports
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              PrepX Nepal is built for Nepal Medical Education Commission (MEC) CEE aspirants: take
              realistic mocks, review every mistake, and focus revision where you can gain the most marks.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={promptSignUp}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2"
              >
                Start free mock
                <AppIcon icon={ArrowRight} size="btn" />
              </button>
              <button
                type="button"
                onClick={promptSignIn}
                className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-900 font-medium text-sm rounded-xl border border-slate-200"
              >
                View sample report
              </button>
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-1.5">
                <AppIcon icon={Check} size="btn" className="text-blue-600 shrink-0" />
                200-question mocks
              </li>
              <li className="flex items-center gap-1.5">
                <AppIcon icon={Check} size="btn" className="text-blue-600 shrink-0" />
                −0.25 negative marking
              </li>
              <li className="flex items-center gap-1.5">
                <AppIcon icon={Check} size="btn" className="text-blue-600 shrink-0" />
                Chapter-level analysis
              </li>
            </ul>
          </div>

          {/* Product preview mock */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="font-medium text-slate-900">PrepX Dashboard</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">Nepal CEE 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700">
                    <AppIcon icon={Coins} size="btn" className="text-amber-600" />
                    245 coins
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                    <AppIcon icon={Bell} size="btn" />
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold text-[10px]">
                    CA
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
                <div className="hidden md:flex md:col-span-3 border-r border-slate-200 bg-slate-50 p-3 flex-col justify-between text-xs">
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 font-medium ${
                        activeTab === 'overview'
                          ? 'bg-white border border-slate-200 text-blue-600'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      <AppIcon icon={LayoutDashboard} size="btn" />
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={promptSignUp}
                      className="w-full px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-slate-600 hover:bg-white"
                    >
                      <AppIcon icon={FileCheck} size="btn" />
                      Mock Tests
                    </button>
                    <button
                      type="button"
                      onClick={promptSignUp}
                      className="w-full px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-slate-600 hover:bg-white"
                    >
                      <AppIcon icon={LineChart} size="btn" />
                      Analytics
                    </button>
                    <button
                      type="button"
                      onClick={promptSignUp}
                      className="w-full px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-slate-600 hover:bg-white"
                    >
                      <AppIcon icon={BookMarked} size="btn" />
                      Revision
                    </button>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600">
                    <div className="font-medium text-slate-900">Target score</div>
                    <div className="font-mono font-semibold text-blue-600 mt-0.5">165 / 200</div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-9 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Good Morning, CEE Aspirant</h2>
                      <p className="text-xs text-slate-500">Your next mock is scheduled for today.</p>
                    </div>
                    <button
                      type="button"
                      onClick={promptSignUp}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shrink-0"
                    >
                      Start mock
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500 uppercase tracking-wide">Latest CEE mock</span>
                      <span className="text-emerald-700 font-medium">+12 marks</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        142 <span className="text-xs text-slate-500 font-normal">/ 200</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 uppercase block">Accuracy</span>
                        <span className="font-mono font-semibold text-sm">74%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block">Time used</span>
                        <span className="font-mono font-semibold text-sm">2h 41m</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-[10px] text-slate-500 font-medium mb-2 flex justify-between">
                        <span>Score trend (last 5 mocks)</span>
                        <span className="text-blue-600 font-mono">122 → 142</span>
                      </div>
                      <div className="h-9 flex items-end justify-between gap-2">
                        {SCORE_TREND.map((item) => (
                          <div key={item.mock} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full rounded-t-sm ${item.active ? 'bg-blue-600' : 'bg-slate-200'}`}
                              style={{ height: `${(item.score / 200) * 32}px` }}
                            />
                            <span className="text-[9px] font-mono text-slate-500">{item.mock}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="text-[10px] font-semibold text-slate-900 uppercase tracking-wide">
                        Subject readiness
                      </div>
                      {SUBJECT_READINESS.map((subject) => (
                        <div key={subject.name} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-600">{subject.name}</span>
                            <span className="font-mono font-semibold text-blue-600">{subject.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${subject.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase">Suggested next step</p>
                        <h3 className="font-semibold text-sm text-slate-900 mt-1">Revise Chemical Bonding</h3>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          You lost 6 marks in this chapter during your latest mock.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={promptSignUp}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded-lg"
                      >
                        Practice this chapter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 text-center">
        <p className="text-sm text-slate-500">
          Mocks, revision materials, and performance reports in one place.
        </p>
      </div>

      {/* Prep modes */}
      <section id="split-brain-section" className="py-14 lg:py-16 bg-white border-y border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Two preparation modes
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Mock tests for Physics, Chemistry, and MAT. Revision resources for Botany and Zoology — with one shared progress view.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <AppIcon icon={FileCheck} size="card" />
                  <span className="text-sm font-medium">Mock tests</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Physics, Chemistry, MAT, and timed mocks
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  CEE-pattern questions with timed sections, negative marking, and post-mock breakdowns by subject and chapter.
                </p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {[
                    'Full-length 200-question mock tests',
                    '−0.25 negative marking simulation',
                    'Time and accuracy per question',
                    'Rank and score estimates',
                    'Chapter-level mistake review',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <AppIcon icon={Check} size="btn" className="text-blue-600 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={promptSignUp}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2"
              >
                Open mock catalog
                <AppIcon icon={ArrowRight} size="btn" />
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <AppIcon icon={BookOpen} size="card" />
                  <span className="text-sm font-medium">Revision</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Botany, Zoology, and study resources
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Notes, formulas, and practice sets for high-weight biology chapters, linked to weak areas from your mocks.
                </p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {[
                    'Biology revision notes by chapter',
                    'Formula and fact library',
                    'Weak-chapter recommendations',
                    'Daily study targets and checklist',
                    'Study Coins for consistent practice',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <AppIcon icon={Check} size="btn" className="text-blue-600 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={promptSignUp}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium rounded-xl border border-slate-200 flex items-center justify-center gap-2"
              >
                Open formula library
                <AppIcon icon={ArrowRight} size="btn" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works-section" className="py-14 lg:py-16 bg-slate-100">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Three steps from mock to revision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Take a CEE-style mock',
                body: 'Attempt timed questions with authentic marking rules, negative marking, and subject section toggles.',
              },
              {
                step: '02',
                title: 'Understand your mistakes',
                body: 'See subject, chapter, speed, and accuracy breakdowns. Identify where marks were lost.',
              },
              {
                step: '03',
                title: 'Follow your revision plan',
                body: 'Practice chapters most likely to improve your score with formulas, notes, and target sets.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white p-6 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 font-mono font-semibold text-sm flex items-center justify-center border border-blue-100">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance */}
      <section id="performance-section" className="py-14 lg:py-16 bg-white border-y border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Performance reports</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              See where your marks go
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Each mock produces a breakdown by subject, chapter, and question — so you know what to study next.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total MCQs', value: '200 questions' },
                { label: 'Attempted', value: '174 MCQs' },
                { label: 'Correct', value: '142 (+142.0)', accent: 'text-emerald-700' },
                { label: 'Incorrect penalty', value: '32 (−8.0)', accent: 'text-red-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">{stat.label}</span>
                  <div className={`text-lg font-bold font-mono text-slate-900 mt-1 ${stat.accent ?? ''}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Chapter-level mistake diagnosis</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Chemical Kinetics (Chemistry) and Rotational Dynamics (Physics) caused 12 of 32 incorrect answers.
                </p>
              </div>
              <button
                type="button"
                onClick={promptSignUp}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg shrink-0"
              >
                Review weak chapters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Study coins */}
      <section id="coins-section" className="py-14 lg:py-16 bg-slate-100">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Study Coins</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Earn coins for consistent study
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Complete mocks, keep study streaks, and finish daily targets to earn coins for revision packs and practice resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                coins: '+20',
                title: 'Finish a 200-question mock',
                body: 'Complete any timed full-length or chapter mock to earn coins.',
              },
              {
                coins: '+15',
                title: 'Maintain a 5-day study streak',
                body: 'Log in daily and complete at least one revision set.',
              },
              {
                coins: '+10',
                title: 'Complete daily target plan',
                body: 'Check off all subject targets on your daily planner.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
                  <AppIcon icon={Coins} size="btn" className="text-amber-600" />
                  {item.coins} coins
                </div>
                <h3 className="font-semibold text-sm text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factual stats */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono text-blue-600">200</div>
              <div className="text-xs text-slate-600">Questions per mock</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono text-blue-600">5</div>
              <div className="text-xs text-slate-600">Subjects including MAT</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono text-blue-600">−0.25</div>
              <div className="text-xs text-slate-600">Negative marking per wrong answer</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-blue-600">
                <AppIcon icon={Clock} size="lg" />
              </div>
              <div className="text-xs text-slate-600">Timed mock sections</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="bg-blue-600 rounded-2xl p-8 sm:p-10 text-white text-center space-y-5">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Start with a mock, not guesswork
            </h2>
            <p className="text-sm text-blue-100">
              Take your first PrepX mock and see which chapters need attention.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={promptSignUp}
              className="w-full sm:w-auto px-6 py-3 bg-white text-blue-600 hover:bg-slate-50 font-medium text-sm rounded-xl flex items-center justify-center gap-2"
            >
              Start free mock
              <AppIcon icon={ArrowRight} size="btn" />
            </button>
            <button
              type="button"
              onClick={promptSignIn}
              className="w-full sm:w-auto px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-xl border border-blue-500"
            >
              View sample report
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-sm text-slate-600">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-2">
                <BrandLogo size={32} decorative className="shrink-0" />
              <span className="font-semibold text-slate-900">PrepX Nepal</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 font-medium text-sm">
              {[
                'Mock Tests',
                'Resources',
                'Performance Reports',
                'Pricing',
                'Help Centre',
                'Privacy Policy',
                'Terms of Service',
                'Contact',
              ].map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={promptSignUp}
                  className="hover:text-blue-600"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© 2026 PrepX Nepal. Built for Medical Education Commission (MEC) Nepal CEE aspirants.</p>
            <p className="font-mono">Kathmandu, Nepal</p>
          </div>
        </div>
      </footer>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-sm p-2 flex justify-around items-center md:hidden">
        <button
          type="button"
          onClick={promptSignUp}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-blue-600 py-1"
        >
          <AppIcon icon={LayoutDashboard} size="nav" />
          Overview
        </button>
        <button
          type="button"
          onClick={promptSignUp}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-600 py-1"
        >
          <AppIcon icon={FileCheck} size="nav" />
          Mocks
        </button>
        <button
          type="button"
          onClick={promptSignUp}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-600 py-1"
        >
          <AppIcon icon={LineChart} size="nav" />
          Progress
        </button>
        <button
          type="button"
          onClick={promptSignUp}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-600 py-1"
        >
          <AppIcon icon={BookMarked} size="nav" />
          Resources
        </button>
      </div>
    </div>
  );
};
