import React, { useState } from 'react';
import {
  Zap,
  BookOpen,
  CheckCircle2,
  Lock,
  Search,
} from 'lucide-react';
import { MockTest, UserProfile, AttemptReport, MockMode, MockScope } from '../types';
import type { ChapterQuestionCount, SubjectQuestionCount } from '../lib/questionsApi';
import {
  UserPracticeGenerator,
  type PracticeGeneratePayload,
} from './UserPracticeGenerator';
import { AppIcon } from './ui';
interface CatalogViewProps {
  mockTests: MockTest[];
  userProfile: UserProfile;
  pastReports: AttemptReport[];
  onStartMock: (mock: MockTest) => void;
  onGeneratePractice: (payload: PracticeGeneratePayload) => void;
  practiceBusy?: boolean;
  questionStats?: SubjectQuestionCount[];
  chapterStats?: ChapterQuestionCount[];
  onNavigate: (tab: string) => void;
}

type CatalogTab = 'All' | 'FixedFull' | 'DynamicFull' | 'Subject' | 'Chapter';

function resolveMode(m: MockTest): MockMode {
  return m.mode === 'dynamic' ? 'dynamic' : 'fixed';
}

function resolveScope(m: MockTest): MockScope {
  if (m.scope) return m.scope;
  if (m.kind === 'Chapter' || m.testCategory === 'chapter') {
    return m.chapterName ? 'chapter' : 'subject';
  }
  return 'full';
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  mockTests,
  userProfile,
  pastReports,
  onStartMock,
  onGeneratePractice,
  practiceBusy,
  questionStats = [],
  chapterStats = [],
  onNavigate,
}) => {
  const [selectedTab, setSelectedTab] = useState<CatalogTab>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isEntitledBase =
    userProfile.plan === 'Unlimited' || (userProfile.mocksRemaining ?? 0) > 0;

  /** Catalog list: Fixed papers for Fixed/All; hide moderator dynamic blueprints (users self-serve). */
  const filteredMocks = mockTests.filter((m) => {
    if (!m.isPublished) return false;
    const mode = resolveMode(m);
    const scope = resolveScope(m);

    // User-driven dynamic/subject/chapter — do not list moderator dynamic templates
    if (mode === 'dynamic') return false;

    if (selectedTab === 'DynamicFull' || selectedTab === 'Subject' || selectedTab === 'Chapter') {
      return false;
    }
    if (selectedTab === 'FixedFull' && !(mode === 'fixed' && scope === 'full')) return false;
    if (selectedTab === 'All' && mode !== 'fixed') return false;

    if (selectedSubject !== 'All' && selectedTab === 'All') {
      if (m.subject && m.subject !== selectedSubject && m.subject !== 'Combined') return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSubject = m.subject?.toLowerCase().includes(q);
      const matchChapter = m.chapterName?.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchChapter) return false;
    }
    return true;
  });

  const showGenerator =
    selectedTab === 'DynamicFull' || selectedTab === 'Subject' || selectedTab === 'Chapter';
  const generatorScope: MockScope =
    selectedTab === 'Subject' ? 'subject' : selectedTab === 'Chapter' ? 'chapter' : 'full';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Mock tests
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Choose a published mock, or build a full-length, subject, or chapter practice test.
          </p>
        </div>

        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 border border-slate-800 shrink-0">
          <div className="text-xs">
            <div className="text-slate-400 text-[10px]">Your plan</div>
            <div className="font-semibold text-white">
              {userProfile.plan}
              {userProfile.mocksRemaining !== null
                ? ` · ${userProfile.mocksRemaining} mocks left`
                : ' · Unlimited'}
            </div>
          </div>
          {userProfile.plan === 'Free' && (
            <button
              onClick={() => onNavigate('payment')}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[11px] rounded-lg hover:bg-amber-400 transition-colors ml-2 cursor-pointer"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 sm:hidden">Mock type</p>
            <div
              role="tablist"
              aria-label="Mock type"
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-1.5"
            >
              {(
                [
                  ['All', 'All fixed', 'All'],
                  ['FixedFull', 'Fixed full', 'Fixed'],
                  ['DynamicFull', 'Dynamic full', 'Dynamic'],
                  ['Subject', 'Subject-wise', 'Subject'],
                  ['Chapter', 'Chapter-wise', 'Chapter'],
                ] as const
              ).map(([id, desktopLabel, mobileLabel]) => {
                const isActive = selectedTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedTab(id)}
                    className={`min-h-11 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-center sm:whitespace-nowrap sm:shrink-0 ${
                      isActive
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    } ${id === 'Chapter' ? 'col-span-2 sm:col-span-1' : ''}`}
                  >
                    <span className="sm:hidden">{mobileLabel}</span>
                    <span className="hidden sm:inline">{desktopLabel}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug sm:hidden">
              {showGenerator
                ? 'Build a practice test from available questions.'
                : 'Browse published full-length mocks.'}
            </p>
          </div>

          {!showGenerator && (
            <div className="relative w-full sm:max-w-xs sm:ml-auto">
              <AppIcon icon={Search} size="btn" className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Search published mocks"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                aria-label="Search fixed mocks"
              />
            </div>
          )}
        </div>
      </div>

      {showGenerator && (
        <>
          {!isEntitledBase ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-900 space-y-3">
              <p className="font-semibold">Upgrade your plan to unlock practice test generation.</p>
              <button
                type="button"
                onClick={() => onNavigate('payment')}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                View Pricing
              </button>
            </div>
          ) : (
            <UserPracticeGenerator
              scope={generatorScope}
              questionStats={questionStats}
              chapterStats={chapterStats}
              busy={practiceBusy}
              onGenerate={onGeneratePractice}
            />
          )}
        </>
      )}

      {!showGenerator && filteredMocks.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-2 max-w-lg mx-auto">
          <p className="text-sm font-semibold text-slate-900">
            Published full-length mocks will appear here
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            None are available right now. Open the Dynamic, Subject, or Chapter tab to build a
            practice test, or check back soon for new timed mocks from PrepX Nepal.
          </p>
        </div>
      )}

      {!showGenerator && filteredMocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMocks.map((mock) => {
            const isFreeDemo = mock.id.includes('demo') || mock.coinPrice === 0;
            const isEntitled = isEntitledBase || isFreeDemo;
            const mockReports = pastReports.filter((r) => r.mockId === mock.id);
            const attemptCount = mockReports.length;
            const isCompleted = attemptCount > 0;
            const scope = resolveScope(mock);

            const scopeLabel =
              scope === 'full'
                ? 'Full CEE'
                : scope === 'subject'
                  ? `Subject · ${mock.subject || '—'}`
                  : `Chapter · ${mock.subject || '—'}`;

            return (
              <div
                key={mock.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono bg-blue-100 text-blue-800 border border-blue-200">
                        {scopeLabel}
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        Fixed
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      {!isEntitled ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <AppIcon icon={Lock} size="btn" className="text-amber-500" />
                          <span>Locked</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-500" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg">
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">{mock.title}</h3>

                  {mock.chapterName && (
                    <div className="text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-1.5">
                      <AppIcon icon={BookOpen} size="btn" className="text-blue-500 shrink-0" />
                      <span className="truncate">{mock.chapterName}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Curated fixed paper with saved question order and negative marking.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <span className="block font-bold text-slate-900">{mock.totalQuestions} Qs</span>
                      <span className="text-[9px] text-slate-400">Total</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <span className="block font-bold text-slate-900">
                        {mock.durationSec >= 3600
                          ? `${Math.floor(mock.durationSec / 3600)} Hrs`
                          : `${Math.floor(mock.durationSec / 60)} Mins`}
                      </span>
                      <span className="text-[9px] text-slate-400">Duration</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <span className="block font-bold text-rose-600">{mock.wrongMarks}</span>
                      <span className="text-[9px] text-slate-400">Neg Mark</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Attempt Count:</span>
                    <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg font-black">
                      {attemptCount} attempts
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {isEntitled ? (
                    <button
                      onClick={() => onStartMock(mock)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <AppIcon icon={Zap} size="btn" />
                      <span>Start Timed Attempt</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('payment')}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                    >
                      <AppIcon icon={Lock} size="btn" className="text-amber-600" />
                      <span>View plans</span>
                    </button>
                  )}

                  <div className="text-center text-[10px] text-slate-400">
                    {isFreeDemo ? 'Free demo for all aspirants' : 'Uses 1 mock attempt from your plan when you start'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
