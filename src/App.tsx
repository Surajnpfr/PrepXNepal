import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  FileCheck,
  BookOpen,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Footer } from './components/Footer';
import { BrainLanding } from './components/BrainLanding';
import { LandingSignInButton, LandingSignUpButton } from './components/ClerkAuthControls';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { MockEngineView } from './components/MockEngineView';
import { MockStudyView } from './components/MockStudyView';
import { ProgressReportsView } from './components/ProgressReportsView';
import { CoinsWalletView } from './components/CoinsWalletView';
import { PaymentSubmissionView } from './components/PaymentSubmissionView';
import { AdminPanel } from './components/AdminPanel';
import { FormulasView } from './components/FormulasView';
import { AppIcon } from './components/ui';
import { SavedQuestionsView } from './components/SavedQuestionsView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { LeaderboardView } from './components/LeaderboardView';
import { HelpSupportView } from './components/HelpSupportView';
import { ClerkLoadGuard } from './components/ClerkLoadGuard';
import { SeoHead } from './components/SeoHead';
import { AboutView } from './components/AboutView';
import { BrandLogo } from './components/BrandLogo';
import { seoForTab } from './lib/siteSeo';
import { FREE_PLAN_MOCK_ACCESS_ERROR } from './lib/mockAccess';

import { 
  INITIAL_PAST_REPORTS, 
  INITIAL_COIN_TRANSACTIONS, 
  INITIAL_PRICING_PLANS 
} from './data/mockData';

import { 
  UserProfile, 
  UserRole, 
  PlanTier,
  PricingPlan,
  MockTest, 
  AttemptState, 
  AttemptReport, 
  CoinTransaction, 
  PaymentClaim, 
  Question,
  AppNotification,
  StudyPlanTask,
  FormulaSheet,
} from './types';
import { GUEST_PROFILE, isStaffRole, mapClerkUserToProfile, buildPublicMetadataPatch, buildStudentSelfPatch } from './lib/clerkUserMapper';
import { fetchClerkUsers, patchClerkUser } from './lib/clerkApi';
import {
  PLAN_ENTITLEMENTS_SEED,
  applyEntitlementsToPlans,
  type PlanEntitlements,
} from './lib/planEntitlements';
import { applyPlanDisplayNames } from './lib/planDisplay';
import { fetchPlanEntitlements, putPlanEntitlements } from './lib/planEntitlementsApi';
import { claimPlannerReward, redeemCatalogItem } from './lib/coinsApi';
import {
  attributeReferral,
} from './lib/referralApi';
import {
  captureReferralCodeFromLocation,
  clearStoredReferralCode,
  peekStoredReferralCode,
} from './lib/referralCapture';
import {
  approvePaymentClaim,
  deletePaymentClaim,
  fetchPaymentClaims,
  rejectPaymentClaim,
  submitPaymentClaim,
  updatePaymentClaim,
  type PaymentClaimEditInput,
} from './lib/paymentClaimsApi';
import { fetchAttemptReports } from './lib/reportsApi';
import {
  bootstrapFromActivity,
  createNotification,
  detectNewCatalogMocks,
  loadNotifications,
  prependNotification,
  saveNotifications,
  saveSeenMockIds,
  syncPaymentClaimNotifications,
} from './lib/notifications';
import {
  applyCompletionReward,
  createCustomTask,
  ensureDayPlan,
  loadStudyPlanMeta,
  loadStudyPlanTasks,
  saveStudyPlanMeta,
  saveStudyPlanTasks,
  todayKey,
  type StudyPlanMeta,
} from './lib/studyPlanner';
import {
  loadSavedQuestions,
  questionToSavedItem,
  removeSavedQuestion,
  saveSavedQuestions,
  upsertSavedQuestion,
  type SavedQuestionItem,
} from './lib/savedQuestions';
import { COIN_REWARDS } from './lib/coinRewards';
import {
  createQuestion,
  deleteQuestion,
  deleteQuestionBatch,
  fetchQuestionBatches,
  fetchQuestionStats,
  fetchQuestions,
  importQuestionsJson,
  updateQuestion,
  updateQuestionBatchMeta,
  type ChapterQuestionCount,
  type ImportBatch,
  type SubjectQuestionCount,
} from './lib/questionsApi';
import {
  createDynamicMock,
  deleteMock,
  deleteMockBatch,
  downloadSetExportFiles,
  exportMocksAsSetJson,
  fetchMockBatches,
  fetchMocks,
  generatePracticeMock,
  importFixedMocksJson,
  scoreMockAttempt,
  startMockAttempt,
  studyMockPaper,
  updateMockBatchMeta,
  updateMockMeta,
  type MockImportBatch,
} from './lib/mocksApi';
import {
  deleteFormulaBatch,
  fetchFormulaBatches,
  fetchFormulaSheets,
  importFormulaSheetsJson,
  type FormulaImportBatch,
} from './lib/formulasApi';
import type { PracticeGeneratePayload } from './components/UserPracticeGenerator';
import { RouteStatePanel } from './components/RouteStatePanel';
import { useFeedback } from './components/FeedbackProvider';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { HelpSubTab } from './lib/appRoutes';

const USERS_POLL_MS = 5000;
const EMPTY_SUBJECT_STATS: SubjectQuestionCount[] = [
  'Physics',
  'Chemistry',
  'Zoology',
  'Botany',
  'MAT',
  'Mixed',
].map((subject) => ({ subject, count: 0 }));

export function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const feedback = useFeedback();

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersSyncError, setUsersSyncError] = useState<string | null>(null);
  const [lastUsersSyncAt, setLastUsersSyncAt] = useState<string | null>(null);
  const syncingRef = useRef(false);

  // Capture ?ref= early so Clerk modal redirects do not lose it.
  useEffect(() => {
    captureReferralCodeFromLocation();
  }, []);

  // First-touch referral attribution after sign-in.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const code = peekStoredReferralCode() || captureReferralCodeFromLocation();
    if (!code) return;
    let cancelled = false;
    void (async () => {
      try {
        await attributeReferral(getToken, code);
        if (!cancelled) clearStoredReferralCode();
      } catch (err: any) {
        // Keep stored code for retry on next load unless permanently invalid.
        const msg = String(err?.message || '');
        if (
          msg.includes('not found') ||
          msg.includes('own referral') ||
          msg.includes('Invalid referral')
        ) {
          clearStoredReferralCode();
        }
        console.warn('Referral attribute failed:', msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, user]);

  useEffect(() => {
    let cancelled = false;
    void fetchPlanEntitlements()
      .then((entitlements) => {
        if (cancelled) return;
        setPlanEntitlements(entitlements);
        setPricingPlans((prev) =>
          applyPlanDisplayNames(applyEntitlementsToPlans(prev, entitlements))
        );
      })
      .catch((err: any) => {
        console.warn('Failed to load plan entitlements:', err?.message || err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Clear legacy local mock/user caches once — Clerk is the only user source.
  useEffect(() => {
    const hasClearedLegacy = localStorage.getItem('prepx_legacy_cleared_v7');
    if (!hasClearedLegacy) {
      localStorage.removeItem('prepx_reports');
      localStorage.removeItem('prepx_transactions');
      localStorage.removeItem('prepx_claims');
      localStorage.removeItem('prepx_notifications');
      localStorage.removeItem('prepx_seen_mock_ids');
      localStorage.removeItem('prepx_study_plan_tasks');
      localStorage.removeItem('prepx_study_plan_meta');
      localStorage.removeItem('prepx_saved_questions');
      localStorage.removeItem('prepx_users_list');
      localStorage.removeItem('prepx_user_profile');
      localStorage.removeItem('prepx_current_user_email');
      localStorage.setItem('prepx_legacy_cleared_v7', 'true');
    }
  }, []);

  const sessionProfile: UserProfile =
    isLoaded && isSignedIn && user ? mapClerkUserToProfile(user) : GUEST_PROFILE;

  const userProfile =
    usersList.find((u) => u.clerkId === sessionProfile.clerkId || u.email === sessionProfile.email) ||
    sessionProfile;

  const canAccessAdmin = isSignedIn && isStaffRole(sessionProfile);

  const persistProfileToClerk = useCallback(
    async (clerkId: string | undefined, patch: Partial<UserProfile>) => {
      if (!clerkId || !isSignedIn) return;
      try {
        const updated = await patchClerkUser(getToken, clerkId, patch);
        setUsersList((prev) => {
          const exists = prev.some((u) => u.clerkId === updated.clerkId);
          if (!exists) return [updated, ...prev];
          return prev.map((u) => (u.clerkId === updated.clerkId ? { ...u, ...updated } : u));
        });
        if (user && user.id === clerkId) {
          await user.reload();
        }
      } catch (err: any) {
        console.warn('Clerk profile sync failed:', err?.message || err);
        setUsersSyncError(err?.message || 'Clerk sync failed');
      }
    },
    [getToken, isSignedIn, user]
  );

  const refreshUsersFromClerk = useCallback(async () => {
    if (!isSignedIn || !user || syncingRef.current) return;
    syncingRef.current = true;
    const staff = isStaffRole(mapClerkUserToProfile(user));
    try {
      if (staff) {
        const data = await fetchClerkUsers(getToken);
        setUsersList(data.users);
        setLastUsersSyncAt(data.syncedAt);
        setUsersSyncError(null);
      } else {
        const me = mapClerkUserToProfile(user);
        setUsersList([me]);
        setLastUsersSyncAt(new Date().toISOString());
        setUsersSyncError(null);
      }
    } catch (err: any) {
      setUsersList([mapClerkUserToProfile(user)]);
      setUsersSyncError(err?.message || 'Unable to refresh Clerk users');
    } finally {
      syncingRef.current = false;
    }
  }, [getToken, isSignedIn, user]);

  const refreshPaymentClaims = useCallback(async () => {
    if (!isSignedIn) {
      setPaymentClaims([]);
      setPaymentClaimsSyncedAt(null);
      setPaymentClaimsError(null);
      return;
    }
    setPaymentClaimsLoading(true);
    try {
      const data = await fetchPaymentClaims(getToken);
      setPaymentClaims(data.claims);
      setPaymentClaimsSyncedAt(data.syncedAt);
      setPaymentClaimsError(null);

      // Student-side sync: derive approve/reject/pending notifs from server claims.
      if (user) {
        const profile = mapClerkUserToProfile(user);
        setNotifications((prev) =>
          syncPaymentClaimNotifications(prev, {
            userId: profile.id,
            clerkUserId: user.id,
            claims: data.claims,
          })
        );
      }
    } catch (err: any) {
      setPaymentClaimsError(err?.message || 'Failed to load payment claims');
    } finally {
      setPaymentClaimsLoading(false);
    }
  }, [getToken, isSignedIn, user]);

  const refreshPastReports = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const data = await fetchAttemptReports(getToken);
      const serverReports = data.reports || [];
      setPastReports((prev) => {
        const byId = new Map<string, AttemptReport>();
        // Server wins for same id; keep local-only reports if present.
        for (const r of serverReports) byId.set(r.id, r);
        for (const r of prev) {
          if (!byId.has(r.id)) byId.set(r.id, r);
        }
        return [...byId.values()].sort((a, b) =>
          String(b.completedAt).localeCompare(String(a.completedAt))
        );
      });
      for (const r of serverReports) {
        if (r.paperQuestions?.length) {
          localStorage.setItem(
            `prepx_paper_${r.mockId}`,
            JSON.stringify(r.paperQuestions)
          );
        }
      }
    } catch (err: any) {
      console.warn('Failed to load attempt reports:', err?.message || err);
    }
  }, [getToken, isSignedIn]);

  // Load + poll payment claims (dynamic shared queue).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setPaymentClaims([]);
      return;
    }
    void refreshPaymentClaims();
    const interval = window.setInterval(() => {
      void refreshPaymentClaims();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [isLoaded, isSignedIn, refreshPaymentClaims]);

  // Silent hydrate of past mock reports after sign-in (local cache kept on sign-out).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void refreshPastReports();
  }, [isLoaded, isSignedIn, refreshPastReports]);

  const refreshQuestionsBank = useCallback(async () => {
    if (!isSignedIn) {
      setAllQuestions([]);
      setQuestionBatches([]);
      setQuestionStats(EMPTY_SUBJECT_STATS);
      setQuestionStatsTotal(0);
      setChapterStats([]);
      return;
    }
    setQuestionsLoading(true);
    try {
      const staff = isSignedIn && user ? isStaffRole(mapClerkUserToProfile(user)) : false;
      const [list, stats, batches] = await Promise.all([
        fetchQuestions(getToken),
        fetchQuestionStats(getToken),
        staff
          ? fetchQuestionBatches(getToken).catch(() => ({ batches: [] as ImportBatch[] }))
          : Promise.resolve({ batches: [] as ImportBatch[] }),
      ]);
      setAllQuestions(list.questions);
      setQuestionBatches(batches.batches);
      setQuestionStats(stats.bySubject);
      setChapterStats(stats.byChapter || []);
      setQuestionStatsTotal(stats.total);
      setQuestionsError(null);
    } catch (err: any) {
      setQuestionsError(err?.message || 'Unable to load questions from database');
    } finally {
      setQuestionsLoading(false);
    }
  }, [getToken, isSignedIn, user]);

  const refreshMocksCatalog = useCallback(async () => {
    if (!isSignedIn) {
      setMockTests([]);
      setMockBatches([]);
      return;
    }
    setMocksLoading(true);
    try {
      const staff = user ? isStaffRole(mapClerkUserToProfile(user)) : false;
      const [list, batches] = await Promise.all([
        fetchMocks(getToken),
        staff
          ? fetchMockBatches(getToken).catch(() => ({ batches: [] as MockImportBatch[] }))
          : Promise.resolve({ batches: [] as MockImportBatch[] }),
      ]);
      setMockTests(list.mocks);
      setMockBatches(batches.batches);
      setMocksError(null);

      const catalogUserId =
        (user ? mapClerkUserToProfile(user).id : null) || 'guest';
      if (catalogUserId !== 'guest') {
        const { notifications: freshMocks, seenIds } = detectNewCatalogMocks(
          catalogUserId,
          list.mocks
        );
        saveSeenMockIds(seenIds, catalogUserId);
        if (freshMocks.length > 0) {
          setNotifications((prev) =>
            freshMocks.reduce((acc, n) => prependNotification(acc, n), prev)
          );
        }
      }
    } catch (err: any) {
      setMocksError(err?.message || 'Unable to load mock tests');
    } finally {
      setMocksLoading(false);
    }
  }, [getToken, isSignedIn, user]);

  useEffect(() => {
    void refreshQuestionsBank();
  }, [refreshQuestionsBank]);

  useEffect(() => {
    void refreshMocksCatalog();
  }, [refreshMocksCatalog]);

  const refreshFormulaLibrary = useCallback(async () => {
    if (!isSignedIn) {
      setFormulaSheets([]);
      setFormulaBatches([]);
      setFormulasError(null);
      return;
    }
    setFormulasLoading(true);
    try {
      const staff = isSignedIn && user ? isStaffRole(mapClerkUserToProfile(user)) : false;
      const [list, batches] = await Promise.all([
        fetchFormulaSheets(getToken),
        staff
          ? fetchFormulaBatches(getToken).catch(() => ({
              batches: [] as FormulaImportBatch[],
            }))
          : Promise.resolve({ batches: [] as FormulaImportBatch[] }),
      ]);
      setFormulaSheets(list.sheets);
      setFormulaBatches(batches.batches);
      setFormulasError(null);
    } catch (err: any) {
      setFormulasError(err?.message || 'Unable to load formula library');
    } finally {
      setFormulasLoading(false);
    }
  }, [getToken, isSignedIn, user]);

  useEffect(() => {
    void refreshFormulaLibrary();
  }, [refreshFormulaLibrary]);

  // Seed current Clerk session user immediately (realtime via useUser).
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      setUsersList([]);
      return;
    }
    const me = mapClerkUserToProfile(user);
    setUsersList((prev) => {
      if (prev.length === 0) return [me];
      const withoutMe = prev.filter((u) => u.clerkId !== me.clerkId && u.email !== me.email);
      return [me, ...withoutMe];
    });
  }, [isLoaded, isSignedIn, user]);

  // Near-realtime roster sync from Clerk Backend API (staff poll).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    refreshUsersFromClerk();
    const id = window.setInterval(() => {
      refreshUsersFromClerk();
    }, USERS_POLL_MS);
    return () => window.clearInterval(id);
  }, [isLoaded, isSignedIn, refreshUsersFromClerk]);

  const updateCurrentUser = (updater: (user: UserProfile) => UserProfile) => {
    const base = userProfile;
    const updated = updater(base);
    setUsersList((prev) => {
      const exists = prev.some((u) => u.clerkId === base.clerkId || u.email === base.email);
      if (!exists) return [updated, ...prev];
      return prev.map((u) =>
        u.clerkId === base.clerkId || u.email === base.email ? { ...u, ...updated } : u
      );
    });
    const staff = isStaffRole(base);
    const patch = staff
      ? buildPublicMetadataPatch(updated)
      : buildStudentSelfPatch(updated);
    if (Object.keys(patch).length > 0) {
      void persistProfileToClerk(updated.clerkId || base.clerkId, patch as Partial<UserProfile>);
    }
  };

  const {
    showLanding,
    showNotFound,
    activeTab,
    helpSubTab: helpActiveSubTab,
    attemptedPath,
    goToTab,
    goToLanding,
    enterApp,
    setHelpSubTab,
  } = useAppNavigation();

  const setActiveTab = useCallback(
    (tab: string) => {
      goToTab(tab);
    },
    [goToTab]
  );

  const handleNavigate = useCallback(
    (tab: string, subTab?: string) => {
      if (tab === 'policies' && subTab) {
        goToTab('policies', { helpSubTab: subTab as HelpSubTab });
        return;
      }
      goToTab(tab, subTab ? { helpSubTab: subTab as HelpSubTab } : undefined);
    },
    [goToTab]
  );

  const setHelpActiveSubTab = useCallback(
    (subTab: HelpSubTab) => {
      setHelpSubTab(subTab, true);
    },
    [setHelpSubTab]
  );

  // Signed-in users on `/` go to dashboard. Unsigned users may keep public SEO routes
  // (/reports, /help, /payment, /contact) so crawlers and share links see indexable content;
  // other app URLs still require sign-in.
  const PUBLIC_SEO_TABS = useMemo(() => new Set(['reports', 'policies', 'payment', 'about']), []);
  const [authHandoff, setAuthHandoff] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && showLanding) {
      // Defer shell swap so Clerk can finish closing the OTP modal (no forceRedirect thrash).
      setAuthHandoff(true);
      const id = window.setTimeout(() => {
        enterApp('home', true);
      }, 450);
      return () => window.clearTimeout(id);
    }
    if (!isSignedIn && !showLanding && !showNotFound && !PUBLIC_SEO_TABS.has(activeTab)) {
      setAuthHandoff(false);
      goToLanding(true);
    }
  }, [
    isLoaded,
    isSignedIn,
    showLanding,
    showNotFound,
    activeTab,
    enterApp,
    goToLanding,
    PUBLIC_SEO_TABS,
  ]);

  useEffect(() => {
    if (!showLanding && isSignedIn) {
      setAuthHandoff(false);
    }
  }, [showLanding, isSignedIn]);

  const showPublicSeo =
    isLoaded && !isSignedIn && !showLanding && !showNotFound && PUBLIC_SEO_TABS.has(activeTab);
  const showWelcome =
    !authHandoff &&
    (!isLoaded || (!isSignedIn && !showPublicSeo) || (isSignedIn && showLanding));
  const showAppShell = isLoaded && isSignedIn && !showLanding && !showNotFound && !authHandoff;
  const showAppNotFound = isLoaded && isSignedIn && showNotFound && !showLanding;
  const pageSeo = seoForTab(
    showPublicSeo || showAppShell ? activeTab : null,
    Boolean(showWelcome && !showPublicSeo)
  );

  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [mockBatches, setMockBatches] = useState<MockImportBatch[]>([]);
  const [chapterStats, setChapterStats] = useState<ChapterQuestionCount[]>([]);
  const [mocksLoading, setMocksLoading] = useState(false);
  const [mocksError, setMocksError] = useState<string | null>(null);
  const [practiceBusy, setPracticeBusy] = useState(false);
  const [activeMock, setActiveMock] = useState<MockTest | null>(null);
  const [studyMock, setStudyMock] = useState<MockTest | null>(null);
  const isImmersivePaper = activeTab === 'mock-engine' || activeTab === 'mock-study';

  const [pastReports, setPastReports] = useState<AttemptReport[]>(() => {
    const saved = localStorage.getItem('prepx_reports');
    return saved ? JSON.parse(saved) : INITIAL_PAST_REPORTS;
  });
  const [activeReport, setActiveReport] = useState<AttemptReport | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());
  const [studyPlanTasks, setStudyPlanTasks] = useState<StudyPlanTask[]>(() => loadStudyPlanTasks());
  const [studyPlanMeta, setStudyPlanMeta] = useState<StudyPlanMeta>(() => loadStudyPlanMeta());
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestionItem[]>(() => loadSavedQuestions());
  const plannerDateKey = todayKey();

  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>(() => {
    const saved = localStorage.getItem('prepx_transactions');
    return saved ? JSON.parse(saved) : INITIAL_COIN_TRANSACTIONS;
  });

  const [paymentClaims, setPaymentClaims] = useState<PaymentClaim[]>([]);
  const [paymentClaimsSyncedAt, setPaymentClaimsSyncedAt] = useState<string | null>(null);
  const [paymentClaimsError, setPaymentClaimsError] = useState<string | null>(null);
  const [paymentClaimsLoading, setPaymentClaimsLoading] = useState(false);

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(() => {
    const saved = localStorage.getItem('prepx_pricing_plans');
    const parsed = saved ? (JSON.parse(saved) as PricingPlan[]) : INITIAL_PRICING_PLANS;
    // Migrate stale Free=3 (and feature copy) from older localStorage seeds.
    // Sync card titles to Free/Standard/Premium without changing tier codes.
    return applyPlanDisplayNames(applyEntitlementsToPlans(parsed, PLAN_ENTITLEMENTS_SEED));
  });
  const [planEntitlements, setPlanEntitlements] =
    useState<PlanEntitlements>(PLAN_ENTITLEMENTS_SEED);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionBatches, setQuestionBatches] = useState<ImportBatch[]>([]);
  const [questionStats, setQuestionStats] = useState<SubjectQuestionCount[]>(EMPTY_SUBJECT_STATS);
  const [questionStatsTotal, setQuestionStatsTotal] = useState(0);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [formulaSheets, setFormulaSheets] = useState<FormulaSheet[]>([]);
  const [formulaBatches, setFormulaBatches] = useState<FormulaImportBatch[]>([]);
  const [formulasLoading, setFormulasLoading] = useState(false);
  const [formulasError, setFormulasError] = useState<string | null>(null);

  const currentUserReports = pastReports.filter((r) => r.userId === userProfile.id);
  const currentUserTransactions = coinTransactions.filter((t) => t.userId === userProfile.id);
  const currentUserClaims = paymentClaims.filter((c) => c.userId === userProfile.id);
  const currentUserNotifications = notifications.filter((n) => n.userId === userProfile.id);
  const currentUserPlanTasks = studyPlanTasks.filter(
    (t) => t.userId === userProfile.id && t.dateKey === plannerDateKey
  );
  const currentUserSavedQuestions = savedQuestions.filter((s) => s.userId === userProfile.id);
  const plannerStreak = studyPlanMeta.streakByUser[userProfile.id] || 0;
  const plannerRewardClaimedToday = (studyPlanMeta.rewardedByUser[userProfile.id] || []).includes(
    plannerDateKey
  );
  const announcementNotification =
    currentUserNotifications.find((n) => !n.read) || null;

  useEffect(() => {
    localStorage.setItem('prepx_reports', JSON.stringify(pastReports));
  }, [pastReports]);

  useEffect(() => {
    localStorage.setItem('prepx_transactions', JSON.stringify(coinTransactions));
  }, [coinTransactions]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveStudyPlanTasks(studyPlanTasks);
  }, [studyPlanTasks]);

  useEffect(() => {
    saveStudyPlanMeta(studyPlanMeta);
  }, [studyPlanMeta]);

  useEffect(() => {
    saveSavedQuestions(savedQuestions);
  }, [savedQuestions]);

  // Ensure today's plan exists from mock analytics (or starter tasks).
  useEffect(() => {
    if (!userProfile.id || userProfile.id === 'guest') return;
    setStudyPlanTasks((prev) =>
      ensureDayPlan({
        allTasks: prev,
        userId: userProfile.id,
        dateKey: plannerDateKey,
        profile: userProfile,
        reports: pastReports.filter((r) => r.userId === userProfile.id),
      })
    );
    // Re-run when user or reports change so weak-chapter tasks stay current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.id, plannerDateKey, pastReports.length, pastReports[0]?.id]);

  // Seed inbox from real local activity when empty (no hardcoded demo notifications).
  useEffect(() => {
    if (!userProfile.id || userProfile.id.startsWith('guest')) return;
    setNotifications((prev) => {
      const mine = prev.filter((n) => n.userId === userProfile.id);
      if (mine.length > 0) return prev;
      const seeded = bootstrapFromActivity({
        userId: userProfile.id,
        reports: pastReports.filter((r) => r.userId === userProfile.id),
        transactions: coinTransactions.filter((t) => t.userId === userProfile.id),
        claims: paymentClaims.filter((c) => c.userId === userProfile.id),
      });
      if (seeded.length === 0) return prev;
      return [...seeded, ...prev.filter((n) => n.userId !== userProfile.id)];
    });
    // Intentionally keyed to user switch; activity arrays are read once at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.id]);

  const pushNotification = useCallback(
    (input: Parameters<typeof createNotification>[0]) => {
      setNotifications((prev) => prependNotification(prev, createNotification(input)));
    },
    []
  );

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === userProfile.id ? { ...n, read: true } : n))
    );
  }, [userProfile.id]);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const handleOpenNotification = useCallback(
    (n: AppNotification) => {
      if (n.kind === 'mock_complete' && n.refId) {
        const report = pastReports.find((r) => r.id === n.refId);
        if (report) setActiveReport(report);
      }
      if (n.hrefTab) setActiveTab(n.hrefTab);
    },
    [pastReports]
  );

  const handleToggleStudyTask = useCallback(
    (taskId: string) => {
      const nextTasks = studyPlanTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      setStudyPlanTasks(nextTasks);

      const today = nextTasks.filter(
        (t) => t.userId === userProfile.id && t.dateKey === plannerDateKey
      );
      const allDone = today.length > 0 && today.every((t) => t.completed);
      const { meta, grantCoins } = applyCompletionReward({
        meta: studyPlanMeta,
        userId: userProfile.id,
        dateKey: plannerDateKey,
        allDone,
      });
      setStudyPlanMeta(meta);

      if (grantCoins > 0 && isSignedIn) {
        void (async () => {
          try {
            const rewarded = await claimPlannerReward(getToken, plannerDateKey);
            setUsersList((prev) => {
              const exists = prev.some((u) => u.clerkId === rewarded.user.clerkId);
              if (!exists) return [rewarded.user, ...prev];
              return prev.map((u) =>
                u.clerkId === rewarded.user.clerkId ? { ...u, ...rewarded.user } : u
              );
            });
            setCoinTransactions((cTx) => [
              {
                id: `ctx-planner-${Date.now()}`,
                userId: userProfile.id,
                delta: rewarded.coinReward,
                reason: `Daily study plan completed (${plannerDateKey})`,
                refType: 'planner',
                refId: plannerDateKey,
                createdAt: new Date().toLocaleString(),
              },
              ...cTx,
            ]);
            pushNotification({
              userId: userProfile.id,
              kind: 'planner',
              title: `Daily plan complete · +${rewarded.coinReward} coins`,
              desc: `Streak: ${meta.streakByUser[userProfile.id] || 1} day(s). Keep revising weak chapters.`,
              hrefTab: 'planner',
              refId: `planner-reward-${plannerDateKey}`,
            });
            if (user?.id) await user.reload();
          } catch (err: any) {
            // 409 = already claimed server-side; local meta still marks day complete.
              if (!String(err?.message || '').toLowerCase().includes('already')) {
                void feedback.alert({
                  variant: 'error',
                  title: 'Reward not claimed',
                  message: err?.message || 'Failed to claim planner reward',
                });
              }
          }
        })();
      }
    },
    [
      studyPlanTasks,
      userProfile.id,
      plannerDateKey,
      studyPlanMeta,
      pushNotification,
      isSignedIn,
      getToken,
      user,
    ]
  );

  const handleAddStudyTask = useCallback(
    (subject: string, title: string) => {
      setStudyPlanTasks((prev) => [
        ...prev,
        createCustomTask({
          userId: userProfile.id,
          dateKey: plannerDateKey,
          subject,
          title,
        }),
      ]);
    },
    [userProfile.id, plannerDateKey]
  );

  const handleDeleteStudyTask = useCallback((taskId: string) => {
    setStudyPlanTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const handleToggleSavedQuestion = useCallback(
    (question: Question, saved: boolean) => {
      if (userProfile.id === 'guest') return;
      setSavedQuestions((prev) => {
        if (!saved) {
          return removeSavedQuestion(prev, userProfile.id, question.id);
        }
        return upsertSavedQuestion(
          prev,
          questionToSavedItem({
            userId: userProfile.id,
            question,
            mockId: activeMock?.id,
            mockTitle: activeMock?.title,
          })
        );
      });
    },
    [userProfile.id, activeMock?.id, activeMock?.title]
  );

  const handleRemoveSavedQuestion = useCallback(
    (questionId: string) => {
      setSavedQuestions((prev) => removeSavedQuestion(prev, userProfile.id, questionId));
    },
    [userProfile.id]
  );

  useEffect(() => {
    localStorage.setItem('prepx_pricing_plans', JSON.stringify(pricingPlans));
  }, [pricingPlans]);

  const handleUpdatePricingPlan = (updatedPlan: PricingPlan) => {
    setPricingPlans((prev) => {
      const next = prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
      if (updatedPlan.tier === 'Free' || updatedPlan.tier === 'Premium') {
        const free = next.find((p) => p.tier === 'Free');
        const premium = next.find((p) => p.tier === 'Premium');
        const entitlements: PlanEntitlements = {
          freeMocks:
            typeof free?.mocksGranted === 'number'
              ? free.mocksGranted
              : planEntitlements.freeMocks,
          premiumMocks:
            typeof premium?.mocksGranted === 'number'
              ? premium.mocksGranted
              : planEntitlements.premiumMocks,
        };
        void putPlanEntitlements(getToken, entitlements)
          .then((saved) => {
            setPlanEntitlements(saved);
            setPricingPlans((plans) =>
              applyPlanDisplayNames(applyEntitlementsToPlans(plans, saved))
            );
          })
          .catch((err: any) => {
            console.warn('Failed to persist plan entitlements:', err?.message || err);
          });
      }
      return next;
    });
  };

  const handleAddPricingPlan = (newPlan: PricingPlan) => {
    setPricingPlans(prev => [...prev, newPlan]);
  };

  const handleDeletePricingPlan = (planId: string) => {
    setPricingPlans(prev => prev.filter(p => p.id !== planId));
  };

  const handleUpdateUserRole = (userId: string, role: UserRole) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target?.clerkId) return;
    setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    void persistProfileToClerk(target.clerkId, { role });
  };

  const handleUpdateUserPlan = (userId: string, plan: PlanTier) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target?.clerkId) return;
    const mocksRemaining =
      plan === 'Unlimited'
        ? null
        : plan === 'Premium'
          ? (target.mocksRemaining ?? 0) + planEntitlements.premiumMocks
          : planEntitlements.freeMocks;
    const updated = { ...target, plan, mocksRemaining };
    setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    void persistProfileToClerk(target.clerkId, { plan, mocksRemaining });
  };

  const handleUpdateUserMocks = (userId: string, mocksRemaining: number | null) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target?.clerkId) return;
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, mocksRemaining } : u))
    );
    void persistProfileToClerk(target.clerkId, { mocksRemaining });
  };

  const handleUpdateTargetScore = (newScore: number) => {
    updateCurrentUser(prev => ({ ...prev, targetScore: newScore }));
    pushNotification({
      userId: userProfile.id,
      kind: 'target',
      title: `Target score updated to ${newScore}`,
      desc: 'Your Progress Reports will compare new mocks against this target.',
      hrefTab: 'reports',
      refId: `target-${newScore}`,
    });
  };

  const handleStartMock = async (mock: MockTest) => {
    if (!isSignedIn) {
      await feedback.alert({
        variant: 'warning',
        title: 'Sign in required',
        message: 'Sign in to start a timed mock test.',
      });
      return;
    }
    try {
      setStudyMock(null);
      const resolved = await startMockAttempt(getToken, mock.id);
      if (!resolved.questions.length) {
        await feedback.alert({
          variant: 'warning',
          title: 'Mock unavailable',
          message: 'This mock has no questions available yet.',
        });
        return;
      }
      localStorage.setItem(`prepx_paper_${resolved.id}`, JSON.stringify(resolved.questions));
      // Quota is consumed server-side; refresh Clerk profile for remaining count.
      if (user?.id) await user.reload();
      setActiveMock(resolved);
      setActiveTab('mock-engine');
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Could not start mock',
        message: err?.message || 'Failed to start mock test',
      });
    }
  };

  const handleStudyMock = async (mock: MockTest) => {
    if (!isSignedIn) {
      await feedback.alert({
        variant: 'warning',
        title: 'Sign in required',
        message: 'Sign in to study this paper with answers.',
      });
      return;
    }
    try {
      setActiveMock(null);
      const resolved = await studyMockPaper(getToken, mock.id);
      if (!resolved.questions.length) {
        await feedback.alert({
          variant: 'warning',
          title: 'Paper unavailable',
          message: 'This mock has no questions available yet.',
        });
        return;
      }
      setStudyMock(resolved);
      setActiveTab('mock-study');
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Could not open Study',
        message: err?.message || 'Failed to open study mode',
      });
    }
  };

  const handleGeneratePractice = async (payload: PracticeGeneratePayload) => {
    if (!isSignedIn) {
      await feedback.alert({
        variant: 'warning',
        title: 'Sign in required',
        message: 'Sign in to generate a practice mock.',
      });
      return;
    }
    if (userProfile.plan === 'Free') {
      await feedback.alert({
        variant: 'warning',
        title: 'Free plan: SetA only',
        message: FREE_PLAN_MOCK_ACCESS_ERROR,
        confirmLabel: 'View plans',
      });
      setActiveTab('payment');
      return;
    }
    if (userProfile.plan !== 'Unlimited' && (userProfile.mocksRemaining ?? 0) <= 0) {
      await feedback.alert({
        variant: 'warning',
        title: 'No mock attempts remaining',
        message: 'Upgrade your plan to generate more practice tests.',
        confirmLabel: 'View plans',
      });
      setActiveTab('payment');
      return;
    }
    setPracticeBusy(true);
    try {
      const resolved = await generatePracticeMock(getToken, payload);
      if (!resolved.questions.length) {
        await feedback.alert({
          variant: 'warning',
          title: 'Unable to create test',
          message: 'There are not enough questions available for this practice test yet.',
        });
        return;
      }
      const got = resolved.questions.length;
      const wanted =
        typeof payload.totalQuestions === 'number'
          ? payload.totalQuestions
          : payload.scope === 'full'
            ? 200
            : got;
      if (got < wanted || resolved.partialFill) {
        feedback.toast({
          variant: 'warning',
          message: `Started with ${got} of ${wanted} requested questions (some units were short in the bank).`,
        });
      }
      localStorage.setItem(`prepx_paper_${resolved.id}`, JSON.stringify(resolved.questions));
      if (user?.id) await user.reload();
      setActiveMock(resolved);
      setActiveTab('mock-engine');
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Generation failed',
        message: err?.message || 'Failed to generate practice mock',
      });
    } finally {
      setPracticeBusy(false);
    }
  };

  const handleSubmitAttempt = async (attempt: AttemptState) => {
    const paperFromStorage = (() => {
      try {
        const raw = localStorage.getItem(`prepx_paper_${attempt.mockId}`);
        return raw ? (JSON.parse(raw) as Question[]) : [];
      } catch {
        return [] as Question[];
      }
    })();
    const mockMeta = mockTests.find((m) => m.id === attempt.mockId);
    const questions =
      (activeMock?.id === attempt.mockId && activeMock.questions.length
        ? activeMock.questions
        : paperFromStorage.length
          ? paperFromStorage
          : mockMeta?.questions) || [];
    const mock: MockTest = {
      ...(activeMock?.id === attempt.mockId ? activeMock : mockMeta || activeMock)!,
      questions,
    };
    if (!mock || !questions.length) {
      await feedback.alert({
        variant: 'error',
        title: 'Cannot score attempt',
        message: 'Paper questions are missing. Restart the mock and submit again.',
      });
      return;
    }
    if (!mock.attemptSessionId) {
      await feedback.alert({
        variant: 'error',
        title: 'Session expired',
        message: 'Missing attempt session. Restart the mock and submit again.',
      });
      return;
    }

    try {
      const scored = await scoreMockAttempt(getToken, {
        attemptSessionId: mock.attemptSessionId,
        questionIds: questions.map((q) => q.id),
        answers: attempt.answers,
        mockId: mock.id,
        mockTitle: mock.title,
        attemptId: attempt.id,
        startedAt: attempt.startedAt,
        correctMarks: mock.correctMarks,
        wrongMarks: mock.wrongMarks,
      });

      const newReport = scored.report as AttemptReport;
      localStorage.setItem(
        `prepx_paper_${mock.id}`,
        JSON.stringify(newReport.paperQuestions || questions)
      );

      setPastReports((prev) => [newReport, ...prev]);
      setActiveReport(newReport);

      if (scored.user) {
        setUsersList((prev) => {
          const exists = prev.some((u) => u.clerkId === scored.user.clerkId);
          if (!exists) return [scored.user, ...prev];
          return prev.map((u) =>
            u.clerkId === scored.user.clerkId ? { ...u, ...scored.user } : u
          );
        });
      }

      setCoinTransactions((prev) => [
        {
          id: `ctx-${Date.now()}`,
          userId: userProfile.id,
          delta: scored.coinReward || COIN_REWARDS.MOCK_COMPLETE,
          reason: `Completed ${mock.title}`,
          refType: 'attempt',
          refId: attempt.id,
          createdAt: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      pushNotification({
        userId: userProfile.id,
        kind: 'mock_complete',
        title: `Scored ${newReport.overallScore}/${newReport.maxScore} on ${mock.title}`,
        desc: `Accuracy ${newReport.accuracyPercentage}% · +${scored.coinReward} coins`,
        hrefTab: 'reports',
        refId: newReport.id,
      });
      pushNotification({
        userId: userProfile.id,
        kind: 'coins',
        title: `+${scored.coinReward} Study Coins earned`,
        desc: `Reward for completing ${mock.title}`,
        hrefTab: 'coins',
        refId: `ctx-attempt-${attempt.id}`,
      });

      setActiveMock(null);
      setActiveTab('reports');
      if (user?.id) await user.reload();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Scoring failed',
        message: err?.message || 'Failed to score attempt',
      });
    }
  };
  const handleRedeemCoins = async (itemId: string) => {
    if (!isSignedIn) {
      await feedback.alert({
        variant: 'warning',
        title: 'Sign in required',
        message: 'Sign in to redeem Study Coins.',
      });
      return;
    }
    try {
      const result = await redeemCatalogItem(getToken, itemId);
      setUsersList((prev) => {
        const exists = prev.some((u) => u.clerkId === result.user.clerkId);
        if (!exists) return [result.user, ...prev];
        return prev.map((u) =>
          u.clerkId === result.user.clerkId ? { ...u, ...result.user } : u
        );
      });
      setCoinTransactions((prev) => [
        {
          id: `ctx-${Date.now()}`,
          userId: userProfile.id,
          delta: -result.coinCost,
          reason: `Redeemed: ${result.redeemed}`,
          refType: 'redemption',
          refId: itemId,
          createdAt: new Date().toLocaleString(),
        },
        ...prev,
      ]);
      pushNotification({
        userId: userProfile.id,
        kind: 'coins',
        title: `Redeemed ${result.coinCost} coins`,
        desc: result.redeemed,
        hrefTab: 'coins',
        refId: `redeem-${itemId}-${Date.now()}`,
      });
      if (user?.id) await user.reload();
      feedback.toast({
        variant: 'success',
        message: `Redeemed “${result.redeemed}”.`,
      });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Redemption failed',
        message: err?.message || 'Failed to redeem',
      });
    }
  };

  const handleSubmitPaymentClaim = async (
    claimData: Omit<PaymentClaim, 'id' | 'status' | 'submittedAt'>
  ) => {
    try {
      const claim = await submitPaymentClaim(getToken, {
        planCode: claimData.planCode,
        amountNpr: claimData.amountNpr,
        paymentMethod: claimData.paymentMethod,
        transactionRef: claimData.transactionRef,
        screenshotUrl: claimData.screenshotUrl,
        userNotes: claimData.userNotes?.trim() || '',
        promoCode: claimData.promoCode,
      });
      setPaymentClaims((prev) => {
        const without = prev.filter((c) => c.id !== claim.id);
        return [claim, ...without];
      });
      pushNotification({
        userId: userProfile.id,
        kind: 'payment',
        title: 'Payment claim submitted',
        desc: `${claim.planCode} · Rs. ${claim.amountNpr} · pending review`,
        hrefTab: 'payment',
        refId: `${claim.id}-pending`,
      });
      feedback.toast({
        variant: 'success',
        message: 'Payment claim submitted for review.',
      });
      void refreshPaymentClaims();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Submit failed',
        message: err?.message || 'Could not submit payment claim',
      });
      throw err;
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      const result = await approvePaymentClaim(getToken, claimId);
      setPaymentClaims((prev) =>
        prev.map((c) => (c.id === claimId ? result.claim : c))
      );
      if (result.activatedUser && typeof result.activatedUser === 'object') {
        const activated = result.activatedUser as UserProfile;
        setUsersList((prev) => {
          const exists = prev.some((u) => u.clerkId === activated.clerkId || u.id === activated.id);
          if (!exists) return [activated, ...prev];
          return prev.map((u) =>
            u.clerkId === activated.clerkId || u.id === activated.id ? { ...u, ...activated } : u
          );
        });
      }
      // Payment status notifs are synced on the student's device via claim polling.
      if (result.referralCommission?.recorded) {
        feedback.toast({
          variant: 'success',
          message: `Claim approved · referral commission Rs. ${result.referralCommission.commission?.commissionAmountNpr ?? '—'}`,
        });
      } else {
        feedback.toast({ variant: 'success', message: 'Payment claim approved.' });
      }
      void refreshPaymentClaims();
      void refreshUsersFromClerk();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Approve failed',
        message: err?.message || 'Could not approve claim',
      });
    }
  };

  const handleRejectClaim = async (claimId: string, reason: string) => {
    try {
      const claim = await rejectPaymentClaim(getToken, claimId, reason);
      setPaymentClaims((prev) => prev.map((c) => (c.id === claimId ? claim : c)));
      // Student sees rejection via syncPaymentClaimNotifications on their next claims poll.
      feedback.toast({ variant: 'success', message: 'Payment claim rejected.' });
      void refreshPaymentClaims();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Reject failed',
        message: err?.message || 'Could not reject claim',
      });
    }
  };

  const handleUpdateClaim = async (claimId: string, patch: PaymentClaimEditInput) => {
    try {
      const claim = await updatePaymentClaim(getToken, claimId, patch);
      setPaymentClaims((prev) => prev.map((c) => (c.id === claimId ? claim : c)));
      feedback.toast({ variant: 'success', message: 'Payment claim updated.' });
      void refreshPaymentClaims();
      return claim;
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Update failed',
        message: err?.message || 'Could not update claim',
      });
      throw err;
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    try {
      await deletePaymentClaim(getToken, claimId);
      setPaymentClaims((prev) => prev.filter((c) => c.id !== claimId));
      feedback.toast({ variant: 'success', message: 'Payment claim deleted from queue.' });
      void refreshPaymentClaims();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Delete failed',
        message: err?.message || 'Could not delete claim',
      });
      throw err;
    }
  };

  const handleUpdateUserCoins = (userId: string, newAmount: number) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;
    const delta = newAmount - target.studyCoinBalance;

    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, studyCoinBalance: newAmount } : u))
    );

    setCoinTransactions((cTx) => [
      {
        id: `ctx-admin-${Date.now()}`,
        userId,
        delta,
        reason: `Admin Adjustment by ${userProfile.name} (Set to ${newAmount} coins)`,
        refType: 'admin_adjustment',
        refId: `adm-${Date.now()}`,
        createdAt: new Date().toLocaleString(),
      },
      ...cTx,
    ]);

    pushNotification({
      userId,
      kind: 'coins',
      title: delta >= 0 ? `+${delta} coins credited` : `${delta} coins adjusted`,
      desc: `Admin set your balance to ${newAmount}`,
      hrefTab: 'coins',
      refId: `adm-coins-${userId}-${newAmount}`,
    });

    if (target.clerkId) {
      void persistProfileToClerk(target.clerkId, { studyCoinBalance: newAmount });
    }
  };

  const handleBulkImportJSON = async (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const result = await importQuestionsJson(getToken, parsed, meta);
      await refreshQuestionsBank();
      const batch =
        result.batchId && Array.isArray(result.batches)
          ? result.batches.find((b) => b.id === result.batchId) || null
          : null;
      return {
        successCount: result.successCount,
        errors: result.errors,
        batchId: result.batchId,
        batch,
      };
    } catch (e: any) {
      return {
        successCount: 0,
        errors: [`Import Error: ${e.message}`],
        batchId: null,
        batch: null,
      };
    }
  };

  const handleAddQuestionToDb = async (q: Question) => {
    try {
      await createQuestion(getToken, {
        subject: q.subject,
        chapter: q.chapter,
        question: q.stem,
        options: q.options,
        correctAnswer: q.correctOptionKey,
        explanation: q.explanation,
        tags: q.tags,
        language: q.language,
        status: q.status,
        source: q.source,
        id: q.id,
        batchId: q.batchId,
      });
      await refreshQuestionsBank();
    } catch (err: any) {
      console.warn('Create question failed:', err?.message || err);
      setQuestionsError(err?.message || 'Failed to save question');
    }
  };

  const handleUpdateQuestion = async (q: Question) => {
    await updateQuestion(getToken, q.id, {
      subject: q.subject,
      chapter: q.chapter,
      question: q.stem,
      options: q.options,
      correctAnswer: q.correctOptionKey,
      explanation: q.explanation,
      tags: q.tags,
      language: q.language,
      status: q.status,
      source: q.source,
      batchId: q.batchId,
    });
    await refreshQuestionsBank();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    await deleteQuestion(getToken, questionId);
    await refreshQuestionsBank();
  };

  const handleDeleteQuestionBatch = async (batchId: string) => {
    await deleteQuestionBatch(getToken, batchId);
    await refreshQuestionsBank();
  };

  const handleUpdateQuestionBatch = async (
    batchId: string,
    patch: { label?: string; filename?: string | null }
  ) => {
    await updateQuestionBatchMeta(getToken, batchId, patch);
    await refreshQuestionsBank();
  };

  const handleImportFormulaSheets = async (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const result = await importFormulaSheetsJson(getToken, parsed, meta);
      await refreshFormulaLibrary();
      const batch =
        result.batchId && Array.isArray(result.batches)
          ? result.batches.find((b) => b.id === result.batchId) || null
          : null;
      return {
        successCount: result.successCount,
        errors: result.errors,
        batchId: result.batchId,
        batch,
      };
    } catch (e: any) {
      return {
        successCount: 0,
        errors: [`Import Error: ${e.message}`],
        batchId: null,
        batch: null,
      };
    }
  };

  const handleDeleteFormulaBatch = async (batchId: string) => {
    await deleteFormulaBatch(getToken, batchId);
    await refreshFormulaLibrary();
  };

  const handleImportFixedMocks = async (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const result = await importFixedMocksJson(getToken, parsed, meta);
      await refreshMocksCatalog();
      await refreshQuestionsBank();
      const batch =
        result.batchId && Array.isArray(result.batches)
          ? result.batches.find((b) => b.id === result.batchId) || null
          : null;
      return {
        successCount: result.successCount,
        errors: result.errors,
        batchId: result.batchId,
        batch,
      };
    } catch (e: any) {
      return {
        successCount: 0,
        errors: [`Import Error: ${e.message}`],
        batchId: null,
        batch: null,
      };
    }
  };

  const handleCreateDynamicMock = async (payload: Parameters<typeof createDynamicMock>[1]) => {
    await createDynamicMock(getToken, payload);
    await refreshMocksCatalog();
  };

  const handleUpdateMock = async (id: string, patch: Record<string, unknown>) => {
    await updateMockMeta(getToken, id, patch);
    await refreshMocksCatalog();
  };

  const handleDeleteMock = async (id: string) => {
    await deleteMock(getToken, id);
    await refreshMocksCatalog();
    await refreshQuestionsBank();
  };

  const handleDeleteMockBatch = async (batchId: string) => {
    await deleteMockBatch(getToken, batchId);
    await refreshMocksCatalog();
    await refreshQuestionsBank();
  };

  const handleUpdateMockBatch = async (
    batchId: string,
    patch: { label?: string; filename?: string | null }
  ) => {
    await updateMockBatchMeta(getToken, batchId, patch);
    await refreshMocksCatalog();
    await refreshQuestionsBank();
  };

  const handleExportMockSets = async (selection: {
    batchIds?: string[];
    mockIds?: string[];
  }) => {
    const result = await exportMocksAsSetJson(getToken, selection);
    downloadSetExportFiles(result.files);
    return { fileCount: result.fileCount };
  };

  const pendingClaimsCount = paymentClaims.filter(c => c.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[var(--px-bg)] text-[var(--px-body)] flex flex-col font-sans antialiased relative overflow-x-hidden">
      <ClerkLoadGuard />
      <SeoHead page={pageSeo} />
      {authHandoff && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-[#F4F7FC] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.14),rgba(255,255,255,0))] text-slate-900"
          role="status"
          aria-live="polite"
          aria-label="Signing you in"
        >
          <BrandLogo size={48} decorative />
          <div className="text-center space-y-1.5 px-6">
            <p className="text-lg font-bold tracking-tight text-slate-900">Signing you in…</p>
            <p className="text-sm text-slate-600">Opening your PrepX Nepal dashboard.</p>
          </div>
          <div
            className="mt-2 h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"
            aria-hidden
          />
        </div>
      )}
      {showWelcome && (
        <BrainLanding
          onNavigatePublic={(tab, subTab) => {
            if (tab === 'contact') {
              goToTab('policies', { helpSubTab: 'contact' });
              return;
            }
            if (tab === 'policies' && subTab) {
              goToTab('policies', { helpSubTab: subTab as HelpSubTab });
              return;
            }
            goToTab(tab);
          }}
        />
      )}

      {showPublicSeo && (
        <div className="min-h-screen bg-[var(--px-bg)]">
          <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <a href="/" className="font-bold text-slate-900 tracking-tight">
              PrepX <span className="text-[#2563EB]">Nepal</span>
            </a>
            <div className="flex items-center gap-2 text-sm flex-wrap justify-end">
              <a
                href="/"
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                onClick={(e) => {
                  e.preventDefault();
                  goToLanding(true);
                }}
              >
                Welcome
              </a>
              <a
                href="/about"
                className={`px-3 py-1.5 ${
                  activeTab === 'about' ? 'text-[#2563EB] font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('about');
                }}
              >
                About
              </a>
              <a
                href="/payment"
                className={`px-3 py-1.5 ${
                  activeTab === 'payment' ? 'text-[#2563EB] font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('payment');
                }}
              >
                Pricing
              </a>
              <a
                href="/contact"
                className={`px-3 py-1.5 ${
                  activeTab === 'policies' && helpActiveSubTab === 'contact'
                    ? 'text-[#2563EB] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('policies', { helpSubTab: 'contact' });
                }}
              >
                Contact
              </a>
              <a
                href="/help"
                className={`px-3 py-1.5 ${
                  activeTab === 'policies' && helpActiveSubTab !== 'contact'
                    ? 'text-[#2563EB] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('policies', { helpSubTab: 'faq' });
                }}
              >
                Help
              </a>
              <a
                href="/reports"
                className={`px-3 py-1.5 ${
                  activeTab === 'reports' ? 'text-[#2563EB] font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('reports');
                }}
              >
                Reports
              </a>
              <LandingSignInButton />
              <LandingSignUpButton>Sign Up</LandingSignUpButton>
            </div>
          </div>
          {activeTab === 'reports' && (
            <ProgressReportsView
              pastReports={[]}
              activeReport={null}
              userProfile={GUEST_PROFILE}
              onSelectReport={() => undefined}
              onNavigate={(tab) => {
                if (tab === 'policies' || tab === 'reports' || tab === 'payment') {
                  goToTab(tab);
                  return;
                }
                goToLanding(false);
              }}
            />
          )}
          {activeTab === 'policies' && (
            <HelpSupportView
              activeSubTab={helpActiveSubTab}
              setActiveSubTab={setHelpActiveSubTab}
            />
          )}
          {activeTab === 'about' && (
            <AboutView onContact={() => goToTab('policies', { helpSubTab: 'contact' })} />
          )}
          {activeTab === 'payment' && (
            <PaymentSubmissionView
              userProfile={GUEST_PROFILE}
              claimsHistory={[]}
              onSubmitClaim={async () => undefined}
              pricingPlans={pricingPlans}
              guestMode
            />
          )}
        </div>
      )}

      {showAppNotFound && (
        <RouteStatePanel
          icon="not-found"
          title="Page not found"
          message={
            attemptedPath
              ? `No page was found at ${attemptedPath}. Check the link or return to your dashboard.`
              : 'This link is not a PrepX page.'
          }
          primaryLabel="Go to dashboard"
          onPrimary={() => goToTab('home', { replace: true })}
          secondaryLabel="Open welcome page"
          onSecondary={() => goToLanding(true)}
        />
      )}

      {showAppShell && (
      <>
        {!isImmersivePaper && (
          <AnnouncementBar
            message={
              announcementNotification
                ? `${announcementNotification.title}${
                    announcementNotification.desc ? ` — ${announcementNotification.desc}` : ''
                  }`
                : mockTests.length > 0
                  ? `${mockTests.filter((m) => m.isPublished !== false).length} mock tests are ready in Mock Tests`
                  : 'Sign in and open Mock Tests to start a timed CEE practice paper.'
            }
            ctaLabel={
              announcementNotification?.hrefTab === 'catalog'
                ? 'View Mocks'
                : announcementNotification
                  ? 'Open'
                  : 'View Mocks'
            }
            onCtaClick={() => {
              if (announcementNotification) {
                handleOpenNotification(announcementNotification);
                handleMarkNotificationRead(announcementNotification.id);
              } else {
                setActiveTab('catalog');
              }
            }}
            onDismiss={() => {
              if (announcementNotification) {
                handleMarkNotificationRead(announcementNotification.id);
              }
            }}
          />
        )}

          <div className="flex flex-1 relative">
            {!isImmersivePaper && (
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userProfile={userProfile}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                mobileOpen={mobileSidebarOpen}
                setMobileOpen={setMobileSidebarOpen}
                pendingPaymentCount={pendingClaimsCount}
                savedQuestionsCount={currentUserSavedQuestions.length}
              />
            )}

            <div className="flex-1 flex flex-col min-w-0 min-h-0 md:min-h-screen overflow-x-hidden">
              {!isImmersivePaper && (
                <Topbar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  userProfile={userProfile}
                  setMobileOpen={setMobileSidebarOpen}
                  clerkSyncAt={lastUsersSyncAt}
                  clerkSyncError={usersSyncError}
                  notifications={currentUserNotifications}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onMarkRead={handleMarkNotificationRead}
                  onOpenNotification={handleOpenNotification}
                />
              )}

              <main className="flex-1">
                {activeTab === 'home' && (
                  <HomeView
                    userProfile={userProfile}
                    onUpdateTargetScore={handleUpdateTargetScore}
                    mockTests={mockTests}
                    pastReports={currentUserReports}
                    studyPlanTasks={currentUserPlanTasks}
                    onToggleStudyTask={handleToggleStudyTask}
                    onStartMock={handleStartMock}
                    onStudyMock={handleStudyMock}
                    onViewReport={(rep) => {
                      setActiveReport(rep);
                      setActiveTab('reports');
                    }}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'catalog' && (
                  <CatalogView
                    mockTests={mockTests}
                    userProfile={userProfile}
                    pastReports={currentUserReports}
                    onStartMock={handleStartMock}
                    onStudyMock={handleStudyMock}
                    onGeneratePractice={handleGeneratePractice}
                    practiceBusy={practiceBusy}
                    questionStats={questionStats}
                    chapterStats={chapterStats}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'mock-engine' && activeMock && (
                  <MockEngineView
                    mockTest={activeMock}
                    onSubmitAttempt={handleSubmitAttempt}
                    initialBookmarkedIds={currentUserSavedQuestions.map((s) => s.questionId)}
                    onToggleSavedQuestion={handleToggleSavedQuestion}
                    onExit={() => {
                      setActiveMock(null);
                      goToTab('catalog', { replace: true });
                    }}
                  />
                )}

                {activeTab === 'mock-engine' && !activeMock && (
                  <RouteStatePanel
                    icon="error"
                    title="No exam in progress"
                    message="Start a mock from the catalog to open the timed exam screen."
                    primaryLabel="Open mock catalog"
                    onPrimary={() => goToTab('catalog', { replace: true })}
                  />
                )}

                {activeTab === 'mock-study' && studyMock && (
                  <MockStudyView
                    mockTest={studyMock}
                    onExit={() => {
                      setStudyMock(null);
                      goToTab('catalog', { replace: true });
                    }}
                    onGiveMockTest={() => {
                      const target = studyMock;
                      setStudyMock(null);
                      void handleStartMock(target);
                    }}
                  />
                )}

                {activeTab === 'mock-study' && !studyMock && (
                  <RouteStatePanel
                    icon="error"
                    title="No study paper open"
                    message="Choose Study on a fixed mock in the catalog to browse questions with answers."
                    primaryLabel="Open mock catalog"
                    onPrimary={() => goToTab('catalog', { replace: true })}
                  />
                )}

                {activeTab === 'reports' && (
                  <ProgressReportsView
                    pastReports={currentUserReports}
                    activeReport={activeReport}
                    userProfile={userProfile}
                    onSelectReport={setActiveReport}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'coins' && (
                  <CoinsWalletView
                    userProfile={userProfile}
                    transactions={currentUserTransactions}
                    onRedeemCoins={handleRedeemCoins}
                  />
                )}

                {activeTab === 'payment' && (
                  <PaymentSubmissionView
                    userProfile={userProfile}
                    claimsHistory={currentUserClaims}
                    onSubmitClaim={handleSubmitPaymentClaim}
                    pricingPlans={pricingPlans}
                  />
                )}

                {activeTab === 'formulas' && (
                  <FormulasView sheets={formulaSheets} />
                )}

                {activeTab === 'saved' && (
                  <SavedQuestionsView
                    items={currentUserSavedQuestions}
                    onRemove={handleRemoveSavedQuestion}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'planner' && (
                  <StudyPlannerView
                    userProfile={userProfile}
                    tasks={currentUserPlanTasks}
                    streak={plannerStreak}
                    dateKey={plannerDateKey}
                    rewardClaimedToday={plannerRewardClaimedToday}
                    onToggleTask={handleToggleStudyTask}
                    onAddTask={handleAddStudyTask}
                    onDeleteTask={handleDeleteStudyTask}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'leaderboard' && (
                  <LeaderboardView
                    userProfile={userProfile}
                    pastReports={currentUserReports}
                    usersList={usersList}
                  />
                )}

                {activeTab === 'policies' && (
                  <HelpSupportView
                    activeSubTab={helpActiveSubTab}
                    setActiveSubTab={setHelpActiveSubTab}
                  />
                )}

                {activeTab === 'about' && (
                  <AboutView onContact={() => goToTab('policies', { helpSubTab: 'contact' })} />
                )}

                {activeTab === 'admin' && canAccessAdmin && (
                  <AdminPanel
                    userProfile={userProfile}
                    paymentClaims={paymentClaims}
                    paymentClaimsLoading={paymentClaimsLoading}
                    paymentClaimsError={paymentClaimsError}
                    paymentClaimsSyncedAt={paymentClaimsSyncedAt}
                    onRefreshPaymentClaims={() => void refreshPaymentClaims()}
                    onApproveClaim={handleApproveClaim}
                    onRejectClaim={handleRejectClaim}
                    onUpdateClaim={handleUpdateClaim}
                    onDeleteClaim={handleDeleteClaim}
                    questions={allQuestions}
                    questionBatches={questionBatches}
                    onAddQuestion={(q) => void handleAddQuestionToDb(q)}
                    onBulkImportJSON={handleBulkImportJSON}
                    onUpdateQuestion={handleUpdateQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onDeleteQuestionBatch={handleDeleteQuestionBatch}
                    onUpdateQuestionBatch={handleUpdateQuestionBatch}
                    questionStats={questionStats}
                    questionStatsTotal={questionStatsTotal}
                    questionStatsLoading={questionsLoading}
                    questionStatsError={questionsError}
                    chapterStats={chapterStats}
                    mockTests={mockTests}
                    mockBatches={mockBatches}
                    mocksLoading={mocksLoading}
                    mocksError={mocksError}
                    onImportFixedMocks={handleImportFixedMocks}
                    onCreateDynamicMock={handleCreateDynamicMock}
                    onUpdateMock={handleUpdateMock}
                    onDeleteMock={handleDeleteMock}
                    onDeleteMockBatch={handleDeleteMockBatch}
                    onUpdateMockBatch={handleUpdateMockBatch}
                    onExportMockSets={handleExportMockSets}
                    formulaSheets={formulaSheets}
                    formulaBatches={formulaBatches}
                    formulasLoading={formulasLoading}
                    formulasError={formulasError}
                    onImportFormulaSheets={handleImportFormulaSheets}
                    onDeleteFormulaBatch={handleDeleteFormulaBatch}
                    usersList={usersList}
                    onUpdateUserRole={handleUpdateUserRole}
                    onUpdateUserPlan={handleUpdateUserPlan}
                    onUpdateUserCoins={handleUpdateUserCoins}
                    onUpdateUserMocks={handleUpdateUserMocks}
                    pricingPlans={pricingPlans}
                    onUpdatePricingPlan={handleUpdatePricingPlan}
                    onAddPricingPlan={handleAddPricingPlan}
                    onDeletePricingPlan={handleDeletePricingPlan}
                    clerkSyncedAt={lastUsersSyncAt}
                    onRefreshClerkUsers={refreshUsersFromClerk}
                  />
                )}

                {activeTab === 'admin' && !canAccessAdmin && (
                  <RouteStatePanel
                    icon="forbidden"
                    title={isSignedIn ? 'Access denied' : 'Sign in required'}
                    message={
                      isSignedIn
                        ? 'Your account does not have admin or moderator access. Contact PrepX staff if you need staff tools.'
                        : 'Sign in with a staff account to open Admin tools.'
                    }
                    primaryLabel="Go to dashboard"
                    onPrimary={() => goToTab('home', { replace: true })}
                    secondaryLabel={isSignedIn ? undefined : 'Open welcome page'}
                    onSecondary={isSignedIn ? undefined : () => goToLanding(true)}
                  />
                )}
              </main>

              {!isImmersivePaper && (
                <div className="md:hidden sticky bottom-0 z-40 bg-[var(--px-surface)] border-t border-[var(--px-border)] px-2 py-1.5 flex items-center justify-around shadow-[var(--px-shadow)]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className={`min-h-11 flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer text-[11px] font-medium ${
                      activeTab === 'home' ? 'text-[#2563EB]' : 'text-slate-500'
                    }`}
                  >
                    <AppIcon icon={LayoutDashboard} size="nav" />
                    Home
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className={`min-h-11 flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer text-[11px] font-medium ${
                      activeTab === 'catalog' ? 'text-[#2563EB]' : 'text-slate-500'
                    }`}
                  >
                    <AppIcon icon={FileCheck} size="nav" />
                    Mocks
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('formulas')}
                    className={`min-h-11 flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer text-[11px] font-medium ${
                      activeTab === 'formulas' ? 'text-[#2563EB]' : 'text-slate-500'
                    }`}
                  >
                    <AppIcon icon={BookOpen} size="nav" />
                    Study
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className={`min-h-11 flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer text-[11px] font-medium ${
                      activeTab === 'reports' ? 'text-[#2563EB]' : 'text-slate-500'
                    }`}
                  >
                    <AppIcon icon={BarChart3} size="nav" />
                    Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('policies')}
                    className={`min-h-11 flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer text-[11px] font-medium ${
                      activeTab === 'policies' ? 'text-[#2563EB]' : 'text-slate-500'
                    }`}
                  >
                    <AppIcon icon={HelpCircle} size="nav" />
                    Help
                  </button>
                </div>
              )}

              {!isImmersivePaper && <Footer onNavigate={handleNavigate} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
