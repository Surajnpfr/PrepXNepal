import React, { useState, useEffect } from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Footer } from './components/Footer';
import { BrainLanding } from './components/BrainLanding';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { MockEngineView } from './components/MockEngineView';
import { ReportView } from './components/ReportView';
import { CoinsWalletView } from './components/CoinsWalletView';
import { PaymentSubmissionView } from './components/PaymentSubmissionView';
import { AdminPanel } from './components/AdminPanel';
import { FormulasView } from './components/FormulasView';
import { SavedQuestionsView } from './components/SavedQuestionsView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { LeaderboardView } from './components/LeaderboardView';
import { HelpSupportView } from './components/HelpSupportView';

import { 
  INITIAL_USER_PROFILE, 
  INITIAL_MOCK_TESTS, 
  INITIAL_PAST_REPORTS, 
  INITIAL_COIN_TRANSACTIONS, 
  INITIAL_PAYMENT_CLAIMS 
} from './data/mockData';

import { 
  UserProfile, 
  UserRole, 
  MockTest, 
  AttemptState, 
  AttemptReport, 
  CoinTransaction, 
  PaymentClaim, 
  Question 
} from './types';

export function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('prepx_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<string>('home');
  const [showBrainLanding, setShowBrainLanding] = useState<boolean>(true);
  
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const [mockTests, setMockTests] = useState<MockTest[]>(INITIAL_MOCK_TESTS);
  const [activeMock, setActiveMock] = useState<MockTest | null>(null);

  const [pastReports, setPastReports] = useState<AttemptReport[]>(() => {
    const saved = localStorage.getItem('prepx_reports');
    return saved ? JSON.parse(saved) : INITIAL_PAST_REPORTS;
  });
  const [activeReport, setActiveReport] = useState<AttemptReport | null>(pastReports[0] || null);

  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>(() => {
    const saved = localStorage.getItem('prepx_transactions');
    return saved ? JSON.parse(saved) : INITIAL_COIN_TRANSACTIONS;
  });

  const [paymentClaims, setPaymentClaims] = useState<PaymentClaim[]>(() => {
    const saved = localStorage.getItem('prepx_claims');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_CLAIMS;
  });

  const [allQuestions, setAllQuestions] = useState<Question[]>(() => {
    return INITIAL_MOCK_TESTS[0]?.questions || [];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('prepx_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('prepx_reports', JSON.stringify(pastReports));
  }, [pastReports]);

  useEffect(() => {
    localStorage.setItem('prepx_transactions', JSON.stringify(coinTransactions));
  }, [coinTransactions]);

  useEffect(() => {
    localStorage.setItem('prepx_claims', JSON.stringify(paymentClaims));
  }, [paymentClaims]);

  // Handle Role Switch
  const handleSetRole = (role: UserRole) => {
    setUserProfile(prev => ({ ...prev, role }));
  };

  // Handle Target Score Update
  const handleUpdateTargetScore = (newScore: number) => {
    setUserProfile(prev => ({ ...prev, targetScore: newScore }));
  };

  // Start Mock Test
  const handleStartMock = (mock: MockTest) => {
    if (userProfile.plan !== 'Unlimited' && userProfile.mocksRemaining !== null && userProfile.mocksRemaining > 0) {
      setUserProfile(prev => ({
        ...prev,
        mocksRemaining: Math.max(0, (prev.mocksRemaining ?? 1) - 1)
      }));
    }
    setActiveMock(mock);
    setActiveTab('mock-engine');
  };

  // Process Completed Attempt & Generate Report
  const handleSubmitAttempt = (attempt: AttemptState) => {
    const mock = mockTests.find(m => m.id === attempt.mockId) || mockTests[0];
    const totalQ = mock.questions.length;
    
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const subjectMap: Record<string, { total: number; correct: number; wrong: number; score: number }> = {};
    const chapterMap: Record<string, { subject: any; total: number; correct: number; wrong: number; skipped: number }> = {};

    mock.questions.forEach(q => {
      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = { total: 0, correct: 0, wrong: 0, score: 0 };
      }
      if (!chapterMap[q.chapter]) {
        chapterMap[q.chapter] = { subject: q.subject, total: 0, correct: 0, wrong: 0, skipped: 0 };
      }

      subjectMap[q.subject].total += 1;
      chapterMap[q.chapter].total += 1;

      const userAns = attempt.answers[q.id];
      if (!userAns) {
        skipped += 1;
        chapterMap[q.chapter].skipped += 1;
      } else if (userAns === q.correctOptionKey) {
        correct += 1;
        subjectMap[q.subject].correct += 1;
        subjectMap[q.subject].score += mock.correctMarks;
        chapterMap[q.chapter].correct += 1;
      } else {
        wrong += 1;
        subjectMap[q.subject].wrong += 1;
        subjectMap[q.subject].score += mock.wrongMarks;
        chapterMap[q.chapter].wrong += 1;
      }
    });

    const netScore = Math.max(0, (correct * mock.correctMarks) + (wrong * mock.wrongMarks));
    const maxScore = totalQ * mock.correctMarks;
    const attemptedCount = correct + wrong;
    const accuracy = attemptedCount > 0 ? Math.round((correct / attemptedCount) * 1000) / 10 : 0;

    const percentile = Math.min(99.9, Math.round((netScore / maxScore) * 100 * 10) / 10);
    const predictedRank = Math.max(1, Math.round((100 - percentile) * 45));
    const rankBand: [number, number] = [Math.max(1, predictedRank - 20), predictedRank + 25];

    const subjectScores = Object.keys(subjectMap).map(sub => {
      const s = subjectMap[sub];
      return {
        subject: sub as any,
        total: s.total,
        score: Math.max(0, s.score),
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
      };
    });

    const chapterScores = Object.keys(chapterMap).map(chap => {
      const c = chapterMap[chap];
      const acc = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
      return {
        subject: c.subject,
        chapter: chap,
        total: c.total,
        correct: c.correct,
        wrong: c.wrong,
        skipped: c.skipped,
        accuracy: acc,
        status: acc < 50 ? ('Weak' as const) : acc > 75 ? ('Strong' as const) : ('Average' as const)
      };
    });

    const newReport: AttemptReport = {
      id: `rep-${Date.now()}`,
      attemptId: attempt.id,
      mockId: mock.id,
      mockTitle: mock.title,
      examType: mock.examType,
      completedAt: new Date().toLocaleString(),
      overallScore: netScore,
      maxScore,
      accuracyPercentage: accuracy,
      totalAttempted: attemptedCount,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      timeSpentSec: mock.durationSec - 300,
      predictedRank,
      rankBand,
      percentile,
      subjectScores,
      chapterScores,
      mistakeAnalysis: {
        wrongVsSkippedRatio: `${wrong} Wrong / ${skipped} Skipped`,
        slowCorrectCount: Math.round(correct * 0.15),
        speedSecPerQuestion: Math.round((mock.durationSec - 300) / (attemptedCount || 1))
      },
      targetScore: userProfile.targetScore,
      targetGap: Math.max(0, userProfile.targetScore - netScore),
      recommendations: [
        {
          id: `rec-${Date.now()}-1`,
          title: 'High-Yield Chemistry & Formula Revision',
          subject: 'Chemistry',
          chapter: 'Chemical Kinetics',
          type: 'Revision Pack',
          coinCost: 15,
          estimatedMinutes: 20,
          questionCount: 25
        }
      ],
      shareToken: `px-token-${Math.floor(Math.random() * 899999 + 100000)}`
    };

    setPastReports(prev => [newReport, ...prev]);
    setActiveReport(newReport);

    const coinReward = 20;
    setUserProfile(prev => ({ ...prev, studyCoinBalance: prev.studyCoinBalance + coinReward }));
    setCoinTransactions(prev => [
      {
        id: `ctx-${Date.now()}`,
        delta: coinReward,
        reason: `Completed ${mock.title}`,
        refType: 'attempt',
        refId: attempt.id,
        createdAt: new Date().toLocaleString()
      },
      ...prev
    ]);

    setActiveMock(null);
    setActiveTab('reports');
  };

  // Redeem Coins Handler
  const handleRedeemCoins = (amount: number, itemTitle: string) => {
    if (userProfile.studyCoinBalance >= amount) {
      setUserProfile(prev => ({
        ...prev,
        studyCoinBalance: prev.studyCoinBalance - amount,
        mocksRemaining: itemTitle.includes('Mock Quota') ? (prev.mocksRemaining ?? 0) + 1 : prev.mocksRemaining
      }));

      setCoinTransactions(prev => [
        {
          id: `ctx-${Date.now()}`,
          delta: -amount,
          reason: `Redeemed: ${itemTitle}`,
          refType: 'redemption',
          refId: `red-${Date.now()}`,
          createdAt: new Date().toLocaleString()
        },
        ...prev
      ]);

      alert(`Successfully redeemed "${itemTitle}"!`);
    }
  };

  // Submit Payment Claim
  const handleSubmitPaymentClaim = (claimData: Omit<PaymentClaim, 'id' | 'status' | 'submittedAt'>) => {
    const newClaim: PaymentClaim = {
      ...claimData,
      id: `pay-claim-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toLocaleString()
    };
    setPaymentClaims(prev => [newClaim, ...prev]);
  };

  // Admin Approve Payment
  const handleApproveClaim = (claimId: string) => {
    const claim = paymentClaims.find(c => c.id === claimId);
    if (claim) {
      setPaymentClaims(prev =>
        prev.map(c => c.id === claimId ? { ...c, status: 'approved', verifiedAt: new Date().toLocaleString(), verifiedBy: userProfile.name } : c)
      );

      if (claim.userId === userProfile.id) {
        setUserProfile(prev => ({
          ...prev,
          plan: claim.planCode,
          mocksRemaining: claim.planCode === 'Unlimited' ? null : (prev.mocksRemaining ?? 0) + 10
        }));
      }
    }
  };

  // Admin Reject Payment
  const handleRejectClaim = (claimId: string, reason: string) => {
    setPaymentClaims(prev =>
      prev.map(c => c.id === claimId ? { ...c, status: 'rejected', moderatorNotes: reason, verifiedAt: new Date().toLocaleString(), verifiedBy: userProfile.name } : c)
    );
  };

  // Bulk Import Questions
  const handleBulkImportJSON = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { successCount: 0, errors: ['Input JSON must be an array of question objects.'] };
      }

      const imported: Question[] = [];
      const errors: string[] = [];

      parsed.forEach((item, idx) => {
        if (!item.subject || !item.chapter || !item.question || !item.options || !item.correctAnswer) {
          errors.push(`Item #${idx + 1}: Missing required fields (subject, chapter, question, options, correctAnswer)`);
        } else {
          imported.push({
            id: `q-imp-${Date.now()}-${idx}`,
            subject: item.subject,
            chapter: item.chapter,
            stem: item.question,
            options: item.options,
            correctOptionKey: item.correctAnswer,
            explanation: item.explanation || 'Solution explanation verified by moderator.',
            tags: item.tags || [],
            language: item.language || 'en',
            status: 'published'
          });
        }
      });

      if (imported.length > 0) {
        setAllQuestions(prev => [...imported, ...prev]);
      }

      return { successCount: imported.length, errors };
    } catch (e: any) {
      return { successCount: 0, errors: [`JSON Parse Error: ${e.message}`] };
    }
  };

  const pendingClaimsCount = paymentClaims.filter(c => c.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F4F7FC] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 relative overflow-x-hidden">
      {/* Brain Split Landing Overlay */}
      {showBrainLanding && (
        <BrainLanding 
          onEnterApp={() => {
            setShowBrainLanding(false);
            setActiveTab('home');
          }}
          onClose={() => setShowBrainLanding(false)}
        />
      )}

      {/* 1. Top Announcement Bar */}
      {activeTab !== 'mock-engine' && (
        <AnnouncementBar onUpgradeClick={() => setActiveTab('payment')} />
      )}

      {/* Main Layout Grid */}
      <div className="flex flex-1 relative">
        {/* 2. Left Collapsible Sidebar */}
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
          />
        )}

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* 3. Top Utility Bar */}
          {activeTab !== 'mock-engine' && (
            <Topbar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              userProfile={userProfile}
              setUserRole={handleSetRole}
              setMobileOpen={setMobileSidebarOpen}
            />
          )}

          {/* Main View Area */}
          <main className="flex-1">
            {activeTab === 'home' && (
              <HomeView
                userProfile={userProfile}
                onUpdateTargetScore={handleUpdateTargetScore}
                mockTests={mockTests}
                pastReports={pastReports}
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
                onStartMock={handleStartMock}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'mock-engine' && activeMock && (
              <MockEngineView
                mockTest={activeMock}
                onSubmitAttempt={handleSubmitAttempt}
                onExit={() => {
                  setActiveMock(null);
                  setActiveTab('catalog');
                }}
              />
            )}

            {activeTab === 'reports' && activeReport && (
              <ReportView
                report={activeReport}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'coins' && (
              <CoinsWalletView
                userProfile={userProfile}
                transactions={coinTransactions}
                onRedeemCoins={handleRedeemCoins}
              />
            )}

            {activeTab === 'payment' && (
              <PaymentSubmissionView
                userProfile={userProfile}
                claimsHistory={paymentClaims}
                onSubmitClaim={handleSubmitPaymentClaim}
              />
            )}

            {activeTab === 'formulas' && (
              <FormulasView />
            )}

            {activeTab === 'saved' && (
              <SavedQuestionsView />
            )}

            {activeTab === 'planner' && (
              <StudyPlannerView />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardView />
            )}

            {activeTab === 'policies' && (
              <HelpSupportView />
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                userProfile={userProfile}
                paymentClaims={paymentClaims}
                onApproveClaim={handleApproveClaim}
                onRejectClaim={handleRejectClaim}
                questions={allQuestions}
                onAddQuestion={(q) => setAllQuestions(prev => [q, ...prev])}
                onBulkImportJSON={handleBulkImportJSON}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation Bar */}
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

          {/* Footer */}
          {activeTab !== 'mock-engine' && <Footer />}
        </div>
      </div>
    </div>
  );
}

export default App;
