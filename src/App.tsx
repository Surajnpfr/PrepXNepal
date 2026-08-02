import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Footer } from './components/Footer';
import { BrainLanding } from './components/BrainLanding';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { MockEngineView } from './components/MockEngineView';
import { ProgressReportsView } from './components/ProgressReportsView';
import { CoinsWalletView } from './components/CoinsWalletView';
import { PaymentSubmissionView } from './components/PaymentSubmissionView';
import { AdminPanel } from './components/AdminPanel';
import { FormulasView } from './components/FormulasView';
import { SavedQuestionsView } from './components/SavedQuestionsView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { LeaderboardView } from './components/LeaderboardView';
import { HelpSupportView } from './components/HelpSupportView';

import { 
  INITIAL_PAST_REPORTS, 
  INITIAL_COIN_TRANSACTIONS, 
  INITIAL_PAYMENT_CLAIMS,
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
} from './types';
import { GUEST_PROFILE, isStaffRole, mapClerkUserToProfile, buildPublicMetadataPatch, buildStudentSelfPatch } from './lib/clerkUserMapper';
import { fetchClerkUsers, patchClerkUser } from './lib/clerkApi';
import { claimPlannerReward, redeemCatalogItem } from './lib/coinsApi';
import {
  bootstrapFromActivity,
  createNotification,
  detectNewCatalogMocks,
  loadNotifications,
  prependNotification,
  saveNotifications,
  saveSeenMockIds,
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
  type ChapterQuestionCount,
  type ImportBatch,
  type SubjectQuestionCount,
} from './lib/questionsApi';
import {
  createDynamicMock,
  deleteMock,
  deleteMockBatch,
  fetchMockBatches,
  fetchMocks,
  generatePracticeMock,
  importFixedMocksJson,
  scoreMockAttempt,
  startMockAttempt,
  updateMockMeta,
  type MockImportBatch,
} from './lib/mocksApi';
import type { PracticeGeneratePayload } from './components/UserPracticeGenerator';

const USERS_POLL_MS = 5000;
const EMPTY_SUBJECT_STATS: SubjectQuestionCount[] = [
  'Physics',
  'Chemistry',
  'Zoology',
  'Botany',
  'MAT',
].map((subject) => ({ subject, count: 0 }));

export function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersSyncError, setUsersSyncError] = useState<string | null>(null);
  const [lastUsersSyncAt, setLastUsersSyncAt] = useState<string | null>(null);
  const syncingRef = useRef(false);

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
        saveSeenMockIds(seenIds);
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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setShowBrainLanding(false);
    }
  }, [isLoaded, isSignedIn]);

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

  const [activeTab, setActiveTab] = useState<string>('home');
  const [helpActiveSubTab, setHelpActiveSubTab] = useState<'info' | 'policies' | 'workflow' | 'terms' | 'privacy' | 'coins-policy' | 'refund' | 'faq' | 'issue'>('info');
  const [showBrainLanding, setShowBrainLanding] = useState<boolean>(true);

  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (tab === 'policies' && subTab) {
      setHelpActiveSubTab(subTab as any);
    }
  };
  
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

  const [paymentClaims, setPaymentClaims] = useState<PaymentClaim[]>(() => {
    const saved = localStorage.getItem('prepx_claims');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_CLAIMS;
  });

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(() => {
    const saved = localStorage.getItem('prepx_pricing_plans');
    return saved ? JSON.parse(saved) : INITIAL_PRICING_PLANS;
  });

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionBatches, setQuestionBatches] = useState<ImportBatch[]>([]);
  const [questionStats, setQuestionStats] = useState<SubjectQuestionCount[]>(EMPTY_SUBJECT_STATS);
  const [questionStatsTotal, setQuestionStatsTotal] = useState(0);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

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
    currentUserNotifications.find((n) => !n.read) || currentUserNotifications[0] || null;

  useEffect(() => {
    localStorage.setItem('prepx_reports', JSON.stringify(pastReports));
  }, [pastReports]);

  useEffect(() => {
    localStorage.setItem('prepx_transactions', JSON.stringify(coinTransactions));
  }, [coinTransactions]);

  useEffect(() => {
    localStorage.setItem('prepx_claims', JSON.stringify(paymentClaims));
  }, [paymentClaims]);

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
              alert(err?.message || 'Failed to claim planner reward');
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
    setPricingPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
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
      plan === 'Unlimited' ? null : plan === 'Premium' ? (target.mocksRemaining ?? 0) + 10 : 3;
    const updated = { ...target, plan, mocksRemaining };
    setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    void persistProfileToClerk(target.clerkId, { plan, mocksRemaining });
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
      alert('Sign in with Clerk to start a mock test.');
      return;
    }
    try {
      const resolved = await startMockAttempt(getToken, mock.id);
      if (!resolved.questions.length) {
        alert('This mock has no questions available yet.');
        return;
      }
      localStorage.setItem(`prepx_paper_${resolved.id}`, JSON.stringify(resolved.questions));
      // Quota is consumed server-side; refresh Clerk profile for remaining count.
      if (user?.id) await user.reload();
      setActiveMock(resolved);
      setActiveTab('mock-engine');
    } catch (err: any) {
      alert(err?.message || 'Failed to start mock test');
    }
  };

  const handleGeneratePractice = async (payload: PracticeGeneratePayload) => {
    if (!isSignedIn) {
      alert('Sign in with Clerk to generate a practice mock.');
      return;
    }
    if (userProfile.plan !== 'Unlimited' && (userProfile.mocksRemaining ?? 0) <= 0) {
      alert('No mock quota remaining. Upgrade your plan to continue.');
      setActiveTab('payment');
      return;
    }
    setPracticeBusy(true);
    try {
      const resolved = await generatePracticeMock(getToken, payload);
      if (!resolved.questions.length) {
        alert('Could not build a paper from the question bank.');
        return;
      }
      localStorage.setItem(`prepx_paper_${resolved.id}`, JSON.stringify(resolved.questions));
      if (user?.id) await user.reload();
      setActiveMock(resolved);
      setActiveTab('mock-engine');
    } catch (err: any) {
      alert(err?.message || 'Failed to generate practice mock');
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
      alert('Could not score attempt: paper questions missing.');
      return;
    }
    if (!mock.attemptSessionId) {
      alert('Missing attempt session. Please restart the mock and submit again.');
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
        desc: `Accuracy ${newReport.accuracyPercentage}% · Predicted rank #${newReport.predictedRank} · +${scored.coinReward} coins`,
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
      alert(err?.message || 'Failed to score attempt');
    }
  };
  const handleRedeemCoins = async (itemId: string) => {
    if (!isSignedIn) {
      alert('Sign in to redeem Study Coins.');
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
      alert(`Successfully redeemed "${result.redeemed}"!`);
    } catch (err: any) {
      alert(err?.message || 'Failed to redeem');
    }
  };

  const handleSubmitPaymentClaim = (claimData: Omit<PaymentClaim, 'id' | 'status' | 'submittedAt'>) => {
    const newClaim: PaymentClaim = {
      ...claimData,
      id: `pay-claim-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toLocaleString()
    };
    setPaymentClaims(prev => [newClaim, ...prev]);
    pushNotification({
      userId: userProfile.id,
      kind: 'payment',
      title: 'Payment claim submitted',
      desc: `${newClaim.planCode} · Rs. ${newClaim.amountNpr} · pending review`,
      hrefTab: 'payment',
      refId: newClaim.id,
    });
  };

  const handleApproveClaim = (claimId: string) => {
    const claim = paymentClaims.find(c => c.id === claimId);
    if (claim) {
      setPaymentClaims(prev =>
        prev.map(c => c.id === claimId ? { ...c, status: 'approved', verifiedAt: new Date().toLocaleString(), verifiedBy: userProfile.name } : c)
      );

      const matchedPlan = pricingPlans.find(p => p.code === claim.planCode || p.tier === claim.planCode || p.id === claim.planCode);
      const newTier = matchedPlan ? matchedPlan.tier : (claim.planCode as PlanTier);
      const mocksToAdd = matchedPlan ? matchedPlan.mocksGranted : (claim.planCode === 'Unlimited' ? null : 10);
      const coinsToAdd = matchedPlan ? matchedPlan.coinsGranted : 100;

      const target = usersList.find((u) => u.id === claim.userId);
      setUsersList(prev =>
        prev.map(u => {
          if (u.id === claim.userId) {
            const updatedMocks = mocksToAdd === null 
              ? null 
              : (u.mocksRemaining !== null ? u.mocksRemaining + mocksToAdd : mocksToAdd);

            return {
              ...u,
              plan: newTier,
              mocksRemaining: updatedMocks,
              studyCoinBalance: u.studyCoinBalance + coinsToAdd
            };
          }
          return u;
        })
      );
      if (target?.clerkId) {
        const updatedMocks =
          mocksToAdd === null
            ? null
            : target.mocksRemaining !== null
              ? target.mocksRemaining + mocksToAdd
              : mocksToAdd;
        void persistProfileToClerk(target.clerkId, {
          plan: newTier,
          mocksRemaining: updatedMocks,
          studyCoinBalance: target.studyCoinBalance + coinsToAdd,
        });
      }

      if (claim.userId) {
        pushNotification({
          userId: claim.userId,
          kind: 'payment',
          title: 'Payment claim approved',
          desc: `${newTier} plan activated · +${coinsToAdd} coins`,
          hrefTab: 'payment',
          refId: `${claimId}-approved`,
        });
      }
    }
  };

  const handleRejectClaim = (claimId: string, reason: string) => {
    const claim = paymentClaims.find((c) => c.id === claimId);
    setPaymentClaims(prev =>
      prev.map(c => c.id === claimId ? { ...c, status: 'rejected', moderatorNotes: reason, verifiedAt: new Date().toLocaleString(), verifiedBy: userProfile.name } : c)
    );
    if (claim?.userId) {
      pushNotification({
        userId: claim.userId,
        kind: 'payment',
        title: 'Payment claim rejected',
        desc: reason || 'Your payment claim was not approved.',
        hrefTab: 'payment',
        refId: `${claimId}-rejected`,
      });
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
  };

  const handleDeleteMockBatch = async (batchId: string) => {
    await deleteMockBatch(getToken, batchId);
    await refreshMocksCatalog();
  };

  const pendingClaimsCount = paymentClaims.filter(c => c.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F4F7FC] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 relative overflow-x-hidden">
      {showBrainLanding && (
        <BrainLanding 
          onEnterApp={() => {
            if (isSignedIn) {
              setShowBrainLanding(false);
              setActiveTab('home');
            } else {
              setShowBrainLanding(false);
            }
          }}
          onClose={() => setShowBrainLanding(false)}
        />
      )}

      <>
        {activeTab !== 'mock-engine' && (
          <AnnouncementBar
            message={
              announcementNotification
                ? announcementNotification.title
                : mockTests.length > 0
                  ? `${mockTests.filter((m) => m.isPublished !== false).length} mocks ready in your catalog`
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
          />
        )}

          <div className="flex flex-1 relative">
            {activeTab !== 'mock-engine' && (
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

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
              {activeTab !== 'mock-engine' && (
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
                      setActiveTab('catalog');
                    }}
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
                  <FormulasView />
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

                {activeTab === 'admin' && canAccessAdmin && (
                  <AdminPanel
                    userProfile={userProfile}
                    paymentClaims={paymentClaims}
                    onApproveClaim={handleApproveClaim}
                    onRejectClaim={handleRejectClaim}
                    questions={allQuestions}
                    questionBatches={questionBatches}
                    onAddQuestion={(q) => void handleAddQuestionToDb(q)}
                    onBulkImportJSON={handleBulkImportJSON}
                    onUpdateQuestion={handleUpdateQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onDeleteQuestionBatch={handleDeleteQuestionBatch}
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
                    usersList={usersList}
                    onUpdateUserRole={handleUpdateUserRole}
                    onUpdateUserPlan={handleUpdateUserPlan}
                    onUpdateUserCoins={handleUpdateUserCoins}
                    pricingPlans={pricingPlans}
                    onUpdatePricingPlan={handleUpdatePricingPlan}
                    onAddPricingPlan={handleAddPricingPlan}
                    onDeletePricingPlan={handleDeletePricingPlan}
                    clerkSyncedAt={lastUsersSyncAt}
                    onRefreshClerkUsers={refreshUsersFromClerk}
                  />
                )}
              </main>

              {activeTab !== 'mock-engine' && (
                <div className="md:hidden sticky bottom-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-lg">
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      activeTab === 'home' ? 'text-[#2563EB] font-bold' : 'text-slate-500'
                    }`}
                  >
                    <div className="text-xs">Home</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('catalog')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      activeTab === 'catalog' ? 'text-[#2563EB] font-bold' : 'text-slate-500'
                    }`}
                  >
                    <div className="text-xs">Mocks</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('formulas')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      activeTab === 'formulas' ? 'text-[#2563EB] font-bold' : 'text-slate-500'
                    }`}
                  >
                    <div className="text-xs">Study</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      activeTab === 'reports' ? 'text-[#2563EB] font-bold' : 'text-slate-500'
                    }`}
                  >
                    <div className="text-xs">Progress</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('policies')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      activeTab === 'policies' ? 'text-[#2563EB] font-bold' : 'text-slate-500'
                    }`}
                  >
                    <div className="text-xs">Profile</div>
                  </button>
                </div>
              )}

              {activeTab !== 'mock-engine' && <Footer onNavigate={handleNavigate} />}
            </div>
          </div>
        </>
    </div>
  );
}

export default App;
