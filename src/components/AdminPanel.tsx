import React, { useRef, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Upload, 
  Users, 
  Coins, 
  BarChart2, 
  FileCode, 
  Sliders, 
  AlertCircle,
  Copy,
  ZoomIn,
  Search,
  Filter,
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  Save,
  Sparkles,
  Tag,
  RotateCcw
} from 'lucide-react';
import { PaymentClaim, Question, UserProfile, UserRole, PlanTier, PricingPlan, MockTest, MockScope } from '../types';
import { BOOTSTRAP_ADMIN_EMAIL, ROLE_CONFIRM_PHRASE } from '../lib/clerkUserMapper';
import type { ChapterQuestionCount, ImportBatch, SubjectQuestionCount } from '../lib/questionsApi';
import type { MockImportBatch } from '../lib/mocksApi';
import { SubjectQuestionsPieChart } from './SubjectQuestionsPieChart';
import { AdminMocksPanel } from './AdminMocksPanel';

interface AdminPanelProps {
  userProfile: UserProfile;
  paymentClaims: PaymentClaim[];
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string, reason: string) => void;
  questions: Question[];
  questionBatches: ImportBatch[];
  onAddQuestion: (q: Question) => void;
  onBulkImportJSON: (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => Promise<{
    successCount: number;
    errors: string[];
    batchId: string | null;
    batch?: ImportBatch | null;
  }>;
  onUpdateQuestion: (q: Question) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
  onDeleteQuestionBatch: (batchId: string) => Promise<void>;
  questionStats: SubjectQuestionCount[];
  questionStatsTotal: number;
  questionStatsLoading?: boolean;
  questionStatsError?: string | null;
  chapterStats?: ChapterQuestionCount[];
  mockTests?: MockTest[];
  mockBatches?: MockImportBatch[];
  mocksLoading?: boolean;
  mocksError?: string | null;
  onImportFixedMocks?: (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => Promise<{
    successCount: number;
    errors: string[];
    batchId: string | null;
    batch?: MockImportBatch | null;
  }>;
  onCreateDynamicMock?: (payload: {
    title: string;
    scope: MockScope;
    subject?: string;
    chapterName?: string;
    durationSec?: number;
    questionsPerPage?: number;
    allocation?: import('../types').MockAllocation;
    isPublished?: boolean;
  }) => Promise<void>;
  onUpdateMock?: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onDeleteMock?: (id: string) => Promise<void>;
  onDeleteMockBatch?: (batchId: string) => Promise<void>;
  usersList: UserProfile[];
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onUpdateUserPlan: (userId: string, plan: PlanTier) => void;
  onUpdateUserCoins: (userId: string, newAmount: number) => void;
  pricingPlans: PricingPlan[];
  onUpdatePricingPlan: (plan: PricingPlan) => void;
  onAddPricingPlan: (plan: PricingPlan) => void;
  onDeletePricingPlan: (planId: string) => void;
  clerkSyncedAt?: string | null;
  onRefreshClerkUsers?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  userProfile,
  paymentClaims,
  onApproveClaim,
  onRejectClaim,
  questions,
  questionBatches,
  onAddQuestion,
  onBulkImportJSON,
  onUpdateQuestion,
  onDeleteQuestion,
  onDeleteQuestionBatch,
  questionStats,
  questionStatsTotal,
  questionStatsLoading,
  questionStatsError,
  chapterStats = [],
  mockTests = [],
  mockBatches = [],
  mocksLoading,
  mocksError,
  onImportFixedMocks,
  onCreateDynamicMock,
  onUpdateMock,
  onDeleteMock,
  onDeleteMockBatch,
  usersList,
  onUpdateUserRole,
  onUpdateUserPlan,
  onUpdateUserCoins,
  pricingPlans,
  onUpdatePricingPlan,
  onAddPricingPlan,
  onDeletePricingPlan,
  clerkSyncedAt,
  onRefreshClerkUsers,
}) => {
  const isQuestionsMod = userProfile.role === 'Moderator (Questions)';
  const isBillingMod = userProfile.role === 'Moderator (Billing)';
  const canEditQuestions =
    userProfile.role === 'Admin' ||
    userProfile.role === 'Moderator (Questions)' ||
    userProfile.email === BOOTSTRAP_ADMIN_EMAIL;

  const [activeTab, setActiveTab] = useState<'payments' | 'questions' | 'import' | 'mocks' | 'users' | 'pricing'>(() => {
    if (isQuestionsMod) return 'questions';
    return 'payments';
  });
  const [inspectingClaim, setInspectingClaim] = useState<PaymentClaim | null>(null);
  const [rejectReason, setRejectReason] = useState('Reference ID mismatch');
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const filteredUsers = (usersList || []).filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );
  const [editingCoinsUser, setEditingCoinsUser] = useState<UserProfile | null>(null);
  const [targetCoinsInput, setTargetCoinsInput] = useState<string>('');
  const [confirmUsernameInput, setConfirmUsernameInput] = useState<string>('');
  const [confirmCoinsInput, setConfirmCoinsInput] = useState<string>('');
  const [coinUpdateSuccessMsg, setCoinUpdateSuccessMsg] = useState<string | null>(null);

  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: UserProfile;
    nextRole: UserRole;
  } | null>(null);
  const [confirmRoleUserInput, setConfirmRoleUserInput] = useState('');
  const [confirmRolePhraseInput, setConfirmRolePhraseInput] = useState('');
  const [roleUpdateSuccessMsg, setRoleUpdateSuccessMsg] = useState<string | null>(null);

  const handleOpenCoinsModal = (targetUser: UserProfile) => {
    setEditingCoinsUser(targetUser);
    setTargetCoinsInput(targetUser.studyCoinBalance.toString());
    setConfirmUsernameInput('');
    setConfirmCoinsInput('');
    setCoinUpdateSuccessMsg(null);
  };

  const handleSaveCoinsModal = () => {
    if (!editingCoinsUser) return;
    const parsedAmount = parseInt(targetCoinsInput, 10);
    if (isNaN(parsedAmount) || parsedAmount < 0) return;

    onUpdateUserCoins(editingCoinsUser.id, parsedAmount);
    setCoinUpdateSuccessMsg(`Study Coins balance for ${editingCoinsUser.name} successfully set to ${parsedAmount} Coins.`);
    setEditingCoinsUser(null);
    setTimeout(() => setCoinUpdateSuccessMsg(null), 5000);
  };

  const requestRoleChange = (target: UserProfile, nextRole: UserRole) => {
    if (target.email === BOOTSTRAP_ADMIN_EMAIL) return;
    if (target.role === nextRole) return;
    // Always ask confirmation at the role dropdown — never write Clerk role on bare onChange.
    setPendingRoleChange({ user: target, nextRole });
    setConfirmRoleUserInput('');
    setConfirmRolePhraseInput('');
  };

  const handleConfirmRoleChange = () => {
    if (!pendingRoleChange) return;
    const nameOk =
      confirmRoleUserInput.trim().toLowerCase() === pendingRoleChange.user.name.trim().toLowerCase();
    const phraseOk = confirmRolePhraseInput.trim() === ROLE_CONFIRM_PHRASE;
    if (!nameOk || !phraseOk) return;

    onUpdateUserRole(pendingRoleChange.user.id, pendingRoleChange.nextRole);
    setRoleUpdateSuccessMsg(
      `${pendingRoleChange.user.name} role confirmed as ${pendingRoleChange.nextRole}.`
    );
    setPendingRoleChange(null);
    setTimeout(() => setRoleUpdateSuccessMsg(null), 5000);
  };

  // Bulk Import state
  const [jsonText, setJsonText] = useState(`[
  {
    "subject": "Physics",
    "chapter": "Electrostatics",
    "question": "What is the electrostatic force between two 1C charges placed 1m apart in vacuum?",
    "options": {
      "A": "9 x 10^9 N",
      "B": "1 N",
      "C": "8.85 x 10^-12 N",
      "D": "Zero"
    },
    "correctAnswer": "A",
    "explanation": "Coulomb law F = k q1 q2 / r^2 = (9 x 10^9) x 1 x 1 / 1 = 9 x 10^9 N.",
    "tags": ["Electrostatics", "Coulomb"],
    "language": "en"
  },
  {
    "subject": "MAT",
    "chapter": "Figure Series",
    "question": "Which figure comes next in the series?",
    "imageUrl": "https://example.com/mat/series-stem.png",
    "options": {
      "A": "Figure A",
      "B": "Figure B",
      "C": "Figure C",
      "D": "Figure D"
    },
    "optionImages": {
      "A": "https://example.com/mat/opt-a.png",
      "B": "https://example.com/mat/opt-b.png",
      "C": "https://example.com/mat/opt-c.png",
      "D": "https://example.com/mat/opt-d.png"
    },
    "correctAnswer": "B",
    "explanation": "The pattern rotates 90° clockwise each step.",
    "tags": ["MAT", "Series"],
    "language": "en"
  }
]`);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errors: string[];
    batchId?: string | null;
    batch?: ImportBatch | null;
  } | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [undoBusy, setUndoBusy] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | 'ungrouped' | null>(null);

  const pendingClaims = paymentClaims.filter(c => c.status === 'pending');

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleApprove = (claimId: string) => {
    onApproveClaim(claimId);
    setInspectingClaim(null);
  };

  const handleReject = (claimId: string) => {
    const finalReason = rejectReason === 'Custom Note' ? customRejectNote : rejectReason;
    onRejectClaim(claimId, finalReason);
    setInspectingClaim(null);
  };

  const handleRunImport = async (
    rawJson?: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => {
    const payload = rawJson ?? jsonText;
    setImportBusy(true);
    setImportFileError(null);
    try {
      const res = await onBulkImportJSON(payload, meta);
      setImportResult(res);
      if (res.batchId) setExpandedBatchId(res.batchId);
    } catch (err: any) {
      setImportResult({
        successCount: 0,
        errors: [err?.message || 'Import failed'],
        batchId: null,
        batch: null,
      });
    } finally {
      setImportBusy(false);
    }
  };

  const handleJsonFileSelected = async (file: File | null) => {
    setImportFileError(null);
    setImportResult(null);
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.json') && file.type !== 'application/json') {
      setImportFileError('Please choose a .json file.');
      setImportFileName(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportFileError('File is too large (max 2 MB). Split the batch into smaller JSON files.');
      setImportFileName(null);
      return;
    }

    try {
      const text = await file.text();
      JSON.parse(text);
      setImportFileName(file.name);
      setJsonText(text);
      await handleRunImport(text, { filename: file.name, label: file.name.replace(/\.json$/i, '') });
    } catch (err: any) {
      setImportFileName(null);
      setImportFileError(err?.message || 'Could not read JSON file');
      setImportResult({
        successCount: 0,
        errors: [`JSON file error: ${err?.message || 'invalid file'}`],
        batchId: null,
        batch: null,
      });
    } finally {
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  const handleSaveEditedQuestion = async () => {
    if (!editingQuestion || !canEditQuestions) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await onUpdateQuestion(editingQuestion);
      setEditingQuestion(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update question');
    } finally {
      setEditBusy(false);
    }
  };

  const handleDeleteQuestionClick = async (q: Question) => {
    if (!canEditQuestions) return;
    if (!window.confirm(`Delete this question?\n\n${q.stem.slice(0, 120)}`)) return;
    try {
      await onDeleteQuestion(q.id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete question');
    }
  };

  const handleDeleteBatchClick = async (batch: ImportBatch, opts?: { asUndo?: boolean }) => {
    if (!canEditQuestions) return;
    const asUndo = Boolean(opts?.asUndo);
    if (
      !window.confirm(
        asUndo
          ? `Undo this import?\n\nBatch: ${batch.label}\nImported by: ${batch.importedByName}\nThis removes all ${batch.questionCount} questions from that import.`
          : `Delete entire batch "${batch.label}" and all ${batch.questionCount} questions in it?`
      )
    ) {
      return;
    }
    setUndoBusy(true);
    try {
      await onDeleteQuestionBatch(batch.id);
      if (importResult?.batchId === batch.id) {
        setImportResult(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to undo/delete batch');
    } finally {
      setUndoBusy(false);
    }
  };

  const handleUndoLastImport = async () => {
    const batch =
      importResult?.batch ||
      (importResult?.batchId
        ? questionBatches.find((b) => b.id === importResult.batchId)
        : undefined);
    if (!batch) {
      alert('No import batch available to undo.');
      return;
    }
    await handleDeleteBatchClick(batch, { asUndo: true });
  };

  const questionsByBatch = (() => {
    const map = new Map<string, Question[]>();
    for (const q of questions) {
      const key = q.batchId || 'ungrouped';
      const list = map.get(key) || [];
      list.push(q);
      map.set(key, list);
    }
    return map;
  })();

  const orderedBatchSections: Array<{
    key: string;
    title: string;
    subtitle: string;
    questions: Question[];
    batch?: ImportBatch;
  }> = [
    ...questionBatches.map((b) => ({
      key: b.id,
      title: b.label,
      subtitle: [
        b.filename ? `File: ${b.filename}` : null,
        `Imported by: ${b.importedByName}${b.importedByEmail ? ` (${b.importedByEmail})` : ''}`,
        `Time: ${new Date(b.createdAt).toLocaleString()}`,
        `${b.questionCount} questions`,
      ]
        .filter(Boolean)
        .join(' · '),
      questions: questionsByBatch.get(b.id) || [],
      batch: b,
    })),
    ...(questionsByBatch.get('ungrouped')?.length
      ? [
          {
            key: 'ungrouped',
            title: 'Ungrouped / legacy',
            subtitle: 'Questions without an import batch (e.g. seed data)',
            questions: questionsByBatch.get('ungrouped') || [],
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full mb-2">
            <Sliders className="w-3.5 h-3.5 text-rose-600" />
            <span>Moderator & Admin Operations Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            PrepX Nepal Admin Panel
          </h1>
        </div>

        <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Level: {userProfile.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 font-bold text-xs">
        {!isQuestionsMod && (
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Payment Moderation Queue</span>
            {pendingClaims.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-2 py-0.2 rounded-full font-bold">
                {pendingClaims.length}
              </span>
            )}
          </button>
        )}

        {!isBillingMod && (
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'questions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Question Bank ({questions.length})
          </button>
        )}

        {!isBillingMod && (
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'import' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bulk JSON Import
          </button>
        )}

        {!isBillingMod && (
          <button
            onClick={() => setActiveTab('mocks')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'mocks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mock Tests ({mockTests.length})
          </button>
        )}

        {!isQuestionsMod && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Users & Wallets
          </button>
        )}

        {!isQuestionsMod && (
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pricing' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Pricing & Plans Manager</span>
          </button>
        )}
      </div>

      {/* TAB 1: Payment Moderation Queue */}
      {activeTab === 'payments' && !isQuestionsMod && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Pending Manual Payment Claims Queue (FIFO)</span>
            <span className="text-xs text-slate-500 font-mono">SLA Goal &le; 2 Hours</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">User Identity</th>
                  <th className="p-3">Plan Requested</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 font-mono">Transaction Ref ID</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{claim.userName}</div>
                      <div className="text-[10px] text-slate-500">{claim.userEmail}</div>
                    </td>
                    <td className="p-3 font-bold text-blue-600">{claim.planCode}</td>
                    <td className="p-3 text-slate-700">{claim.paymentMethod}</td>
                    <td className="p-3 font-mono text-slate-800">{claim.transactionRef}</td>
                    <td className="p-3 text-right font-mono font-bold">NPR {claim.amountNpr}</td>
                    <td className="p-3 text-right">
                      {claim.status === 'pending' ? (
                        <button
                          onClick={() => setInspectingClaim(claim)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Claim</span>
                        </button>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {claim.status.toUpperCase()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Question Management */}
      {activeTab === 'questions' && !isBillingMod && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Questions by import batch
          </h3>

          <SubjectQuestionsPieChart
            bySubject={questionStats}
            total={questionStatsTotal}
            loading={questionStatsLoading}
            error={questionStatsError}
          />

          {orderedBatchSections.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No questions yet. Use Bulk Import to create the first batch.
            </div>
          ) : (
            <div className="space-y-3">
              {orderedBatchSections.map((section) => {
                const open = expandedBatchId === section.key;
                return (
                  <div key={section.key} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-slate-50">
                      <button
                        type="button"
                        className="text-left cursor-pointer flex-1"
                        onClick={() => setExpandedBatchId(open ? null : section.key)}
                      >
                        <div className="text-sm font-bold text-slate-900">
                          {section.title}{' '}
                          <span className="font-mono text-slate-500 font-semibold">
                            ({section.questions.length})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{section.subtitle}</div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        {canEditQuestions && section.batch && (
                          <>
                            <button
                              type="button"
                              disabled={undoBusy}
                              onClick={() => void handleDeleteBatchClick(section.batch!, { asUndo: true })}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 disabled:opacity-60 cursor-pointer inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Undo import
                            </button>
                            <button
                              type="button"
                              disabled={undoBusy}
                              onClick={() => void handleDeleteBatchClick(section.batch!)}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-60 cursor-pointer"
                            >
                              Delete batch
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedBatchId(open ? null : section.key)}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer"
                        >
                          {open ? 'Hide' : 'View'}
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-white text-slate-500 font-mono uppercase text-[10px] border-y border-slate-100">
                              <th className="p-3">Subject</th>
                              <th className="p-3">Chapter</th>
                              <th className="p-3">Stem</th>
                              <th className="p-3 text-center">Ans</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {section.questions.map((q) => (
                              <tr key={q.id} className="hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-900">{q.subject}</td>
                                <td className="p-3 text-slate-600">{q.chapter}</td>
                                <td className="p-3 text-slate-800 font-medium max-w-md truncate">{q.stem}</td>
                                <td className="p-3 text-center font-mono font-bold text-emerald-600">
                                  {q.correctOptionKey}
                                </td>
                                <td className="p-3 text-right">
                                  {canEditQuestions ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingQuestion({ ...q });
                                          setEditError(null);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteQuestionClick(q)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-semibold">View only</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Bulk JSON Import */}
      {activeTab === 'import' && !isBillingMod && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Bulk JSON Question Import
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Upload a <span className="font-mono font-semibold">.json</span> file (array of question objects), or paste JSON below.
            Invalid rows are reported; valid rows are still imported into the database.
          </p>

          <input
            ref={jsonFileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => void handleJsonFileSelected(e.target.files?.[0] ?? null)}
          />

          <div
            className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0] ?? null;
              void handleJsonFileSelected(file);
            }}
          >
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Import from JSON file</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Drag &amp; drop or browse. Max 2 MB. Schema: subject, chapter, question, options, correctAnswer. Optional for MAT: <code className="font-mono">imageUrl</code>, <code className="font-mono">optionImages</code>.
                </div>
                {importFileName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700">
                    <FileCode className="w-3.5 h-3.5" />
                    {importFileName}
                  </div>
                )}
                {importFileError && (
                  <div className="mt-2 text-[11px] font-semibold text-rose-600">{importFileError}</div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={importBusy}
              onClick={() => jsonFileInputRef.current?.click()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
            >
              {importBusy ? 'Importing…' : 'Choose JSON file'}
            </button>
          </div>

          <details className="rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-700 select-none">
              Or paste JSON manually
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setImportFileName(null);
                }}
                className="w-full p-4 bg-slate-950 text-cyan-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleRunImport()}
                disabled={importBusy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {importBusy ? 'Importing into database…' : 'Validate & Import pasted JSON'}
              </button>
            </div>
          </details>

          {importResult && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-emerald-600 font-mono">
                Successfully imported: {importResult.successCount} questions
              </div>

              {(importResult.batch || importResult.batchId) && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                    <Clock className="w-3.5 h-3.5" />
                    Import details
                  </div>
                  <div className="text-slate-800">
                    <span className="text-slate-500">Imported by:</span>{' '}
                    <span className="font-bold">
                      {importResult.batch?.importedByName || userProfile.name}
                    </span>
                    {(importResult.batch?.importedByEmail || userProfile.email) && (
                      <span className="text-slate-500 font-mono">
                        {' '}
                        ({importResult.batch?.importedByEmail || userProfile.email})
                      </span>
                    )}
                  </div>
                  <div className="text-slate-800">
                    <span className="text-slate-500">Role:</span>{' '}
                    <span className="font-bold">{userProfile.role}</span>
                  </div>
                  <div className="text-slate-800">
                    <span className="text-slate-500">Time:</span>{' '}
                    <span className="font-mono font-semibold">
                      {importResult.batch?.createdAt
                        ? new Date(importResult.batch.createdAt).toLocaleString()
                        : new Date().toLocaleString()}
                    </span>
                  </div>
                  {importResult.batch?.filename && (
                    <div className="text-slate-800">
                      <span className="text-slate-500">File:</span>{' '}
                      <span className="font-mono">{importResult.batch.filename}</span>
                    </div>
                  )}
                  {importResult.batchId && (
                    <div className="text-slate-500 font-mono text-[10px]">Batch ID: {importResult.batchId}</div>
                  )}

                  {canEditQuestions && importResult.successCount > 0 && importResult.batchId && (
                    <button
                      type="button"
                      disabled={undoBusy}
                      onClick={() => void handleUndoLastImport()}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 disabled:opacity-60 text-[11px] font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {undoBusy ? 'Undoing…' : 'Undo this import'}
                    </button>
                  )}
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="text-rose-600 font-semibold space-y-1 font-mono">
                  <div>Errors ({importResult.errors.length}):</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mocks' && !isBillingMod && onImportFixedMocks && onCreateDynamicMock && onUpdateMock && onDeleteMock && onDeleteMockBatch && (
        <AdminMocksPanel
          mockTests={mockTests}
          mockBatches={mockBatches}
          mocksLoading={mocksLoading}
          mocksError={mocksError}
          questionStats={questionStats}
          chapterStats={chapterStats}
          canEdit={canEditQuestions}
          onImportFixedMocks={onImportFixedMocks}
          onCreateDynamicMock={onCreateDynamicMock}
          onUpdateMock={onUpdateMock}
          onDeleteMock={onDeleteMock}
          onDeleteMockBatch={onDeleteMockBatch}
        />
      )}

      {/* Edit question modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Edit question</h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Subject</span>
                <select
                  value={editingQuestion.subject}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, subject: e.target.value as Question['subject'] })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {['Physics', 'Chemistry', 'Zoology', 'Botany', 'MAT'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Chapter</span>
                <input
                  value={editingQuestion.chapter}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-700">Stem</span>
                <textarea
                  rows={3}
                  value={editingQuestion.stem}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, stem: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-700">Stem image URL (MAT / diagrams)</span>
                <input
                  value={editingQuestion.imageUrl || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      imageUrl: e.target.value.trim() || undefined,
                    })
                  }
                  placeholder="https://… or /images/mat/q1.png"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
                {editingQuestion.imageUrl && (
                  <img
                    src={editingQuestion.imageUrl}
                    alt="Stem preview"
                    className="mt-2 max-h-40 rounded-lg border border-slate-200 object-contain bg-white"
                  />
                )}
              </label>
              {(['A', 'B', 'C', 'D'] as const).map((key) => (
                <label key={key} className="space-y-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <span className="font-bold text-slate-700 sm:col-span-2">Option {key}</span>
                  <input
                    value={editingQuestion.options[key]}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        options: { ...editingQuestion.options, [key]: e.target.value },
                      })
                    }
                    placeholder={`Option ${key} text`}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                  <input
                    value={editingQuestion.optionImages?.[key] || ''}
                    onChange={(e) => {
                      const url = e.target.value.trim();
                      const next = { ...(editingQuestion.optionImages || {}) };
                      if (url) next[key] = url;
                      else delete next[key];
                      setEditingQuestion({
                        ...editingQuestion,
                        optionImages: Object.keys(next).length ? next : undefined,
                      });
                    }}
                    placeholder={`Option ${key} image URL (optional)`}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </label>
              ))}
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Correct</span>
                <select
                  value={editingQuestion.correctOptionKey}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correctOptionKey: e.target.value as Question['correctOptionKey'],
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {(['A', 'B', 'C', 'D'] as const).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Status</span>
                <select
                  value={editingQuestion.status}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      status: e.target.value as Question['status'],
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="published">published</option>
                  <option value="pending_review">pending_review</option>
                  <option value="flagged">flagged</option>
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-700">Explanation</span>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editBusy}
                onClick={() => void handleSaveEditedQuestion()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {editBusy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal with Split View */}
      {inspectingClaim && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Claim Inspection Modal (Split View)</h3>
              <button 
                onClick={() => setInspectingClaim(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: User & Transaction Metadata */}
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">User Details</div>
                  <div className="font-bold text-slate-900 text-sm">{inspectingClaim.userName}</div>
                  <div className="text-slate-500">{inspectingClaim.userEmail}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Submitted Reference ID</div>
                  <div className="font-bold text-blue-600 text-base flex items-center justify-between">
                    <span>{inspectingClaim.transactionRef}</span>
                    <button
                      onClick={() => handleCopyRef(inspectingClaim.transactionRef)}
                      className="text-xs font-bold text-slate-600 hover:underline"
                    >
                      {copiedRef ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Plan & Amount</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {inspectingClaim.planCode} Plan (NPR {inspectingClaim.amountNpr})
                  </div>
                  <div className="text-slate-500">Method: {inspectingClaim.paymentMethod}</div>
                </div>

                {/* Rejection Reason Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="block font-bold text-slate-800">In Case of Rejection, Select Reason:</label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Reference ID mismatch">Reference ID mismatch</option>
                    <option value="Screenshot unreadable">Screenshot unreadable</option>
                    <option value="Incorrect amount">Incorrect amount</option>
                    <option value="Custom Note">Custom Note</option>
                  </select>

                  {rejectReason === 'Custom Note' && (
                    <input
                      type="text"
                      placeholder="Type custom rejection note..."
                      value={customRejectNote}
                      onChange={(e) => setCustomRejectNote(e.target.value)}
                      className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Screenshot Image Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Uploaded Receipt Screenshot Preview:</div>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-2 text-center">
                  <img
                    src={inspectingClaim.screenshotUrl}
                    alt="Payment Screenshot"
                    className="max-h-64 object-contain mx-auto rounded"
                  />
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    Zoom-on-hover & Pan Preview Active
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleReject(inspectingClaim.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Reject (Flag Claim)
              </button>

              <button
                onClick={() => handleApprove(inspectingClaim.id)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Approve & Grant Entitlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double Confirmation Security Modal for Setting Coins */}
      {editingCoinsUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Security Protocol: Admin Set User Coins
                </h3>
              </div>
              <button 
                onClick={() => setEditingCoinsUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Target Account Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-500 text-[10px] uppercase font-bold">
                <span>Target Account</span>
                <span>Current Balance</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="font-bold text-slate-900 text-sm">{editingCoinsUser.name} <span className="text-slate-400 text-xs font-normal">({editingCoinsUser.email})</span></div>
                <div className="font-black text-amber-700 text-sm">{editingCoinsUser.studyCoinBalance} Coins</div>
              </div>
            </div>

            {/* Step 1: Input New Target Coins */}
            <div className="space-y-1.5 text-xs font-sans">
              <label className="block font-bold text-slate-800">
                1. Set New Target Coins Amount:
              </label>
              <input
                type="number"
                min="0"
                placeholder="Enter target coin balance e.g. 500"
                value={targetCoinsInput}
                onChange={(e) => setTargetCoinsInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Step 2: Double Confirmation Verification Alert & Inputs */}
            <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-3 text-xs font-sans">
              <div className="flex items-start gap-2 text-rose-900 font-semibold text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Required Double Confirmation:</strong> Re-type both the target user's exact name and target coin amount below to verify:
                </span>
              </div>

              {/* Verification Input A: User Name */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <label className="font-bold text-slate-700">
                    Type User Name: <span className="font-mono text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">{editingCoinsUser.name}</span>
                  </label>
                  {confirmUsernameInput.trim().toLowerCase() === editingCoinsUser.name.trim().toLowerCase() && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Name Verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={`Type "${editingCoinsUser.name}" to verify`}
                  value={confirmUsernameInput}
                  onChange={(e) => setConfirmUsernameInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Verification Input B: Coins Amount */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <label className="font-bold text-slate-700">
                    Type Target Amount: <span className="font-mono text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">{targetCoinsInput || '0'}</span>
                  </label>
                  {targetCoinsInput.trim() !== '' && confirmCoinsInput.trim() === targetCoinsInput.trim() && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Amount Verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={`Type "${targetCoinsInput || '0'}" to verify`}
                  value={confirmCoinsInput}
                  onChange={(e) => setConfirmCoinsInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCoinsUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !targetCoinsInput ||
                  isNaN(parseInt(targetCoinsInput, 10)) ||
                  parseInt(targetCoinsInput, 10) < 0 ||
                  confirmUsernameInput.trim().toLowerCase() !== editingCoinsUser.name.trim().toLowerCase() ||
                  confirmCoinsInput.trim() !== targetCoinsInput.trim()
                }
                onClick={handleSaveCoinsModal}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                <span>Confirm & Update Coins</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role change confirmation for Admin / Moderators */}
      {pendingRoleChange && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Confirm role change
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">User</span>
                <span className="font-bold text-slate-900 text-right">
                  {pendingRoleChange.user.name}
                  <span className="block text-slate-400 font-normal">{pendingRoleChange.user.email}</span>
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Current role</span>
                <span className="font-bold text-slate-800">{pendingRoleChange.user.role}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">New role</span>
                <span className="font-black text-rose-700">{pendingRoleChange.nextRole}</span>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-start gap-2 text-rose-900 font-semibold text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Admin/Moderator privileges change Clerk access. Type the user&apos;s name and the confirmation phrase to proceed.
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <label className="font-bold text-slate-700">
                    Type user name:{' '}
                    <span className="font-mono text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                      {pendingRoleChange.user.name}
                    </span>
                  </label>
                  {confirmRoleUserInput.trim().toLowerCase() ===
                    pendingRoleChange.user.name.trim().toLowerCase() && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Name verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={`Type "${pendingRoleChange.user.name}"`}
                  value={confirmRoleUserInput}
                  onChange={(e) => setConfirmRoleUserInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <label className="font-bold text-slate-700">
                    Type phrase:{' '}
                    <span className="font-mono text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                      {ROLE_CONFIRM_PHRASE}
                    </span>
                  </label>
                  {confirmRolePhraseInput.trim() === ROLE_CONFIRM_PHRASE && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Phrase verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={`Type "${ROLE_CONFIRM_PHRASE}"`}
                  value={confirmRolePhraseInput}
                  onChange={(e) => setConfirmRolePhraseInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  confirmRoleUserInput.trim().toLowerCase() !==
                    pendingRoleChange.user.name.trim().toLowerCase() ||
                  confirmRolePhraseInput.trim() !== ROLE_CONFIRM_PHRASE
                }
                onClick={handleConfirmRoleChange}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Confirm role change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Users & Wallets Management */}
      {activeTab === 'users' && !isQuestionsMod && (
        <div className="space-y-6 font-sans">
          {coinUpdateSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{coinUpdateSuccessMsg}</span>
            </div>
          )}

          {roleUpdateSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{roleUpdateSuccessMsg}</span>
            </div>
          )}

          {/* Users Header Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-slate-400 text-[10px] font-mono uppercase font-extrabold">Registered Users</div>
              <div className="text-2xl font-black text-slate-900 font-mono">{(usersList || []).length} Accounts</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-slate-400 text-[10px] font-mono uppercase font-extrabold">Paid Subscriptions</div>
              <div className="text-2xl font-black text-blue-600 font-mono">
                {(usersList || []).filter(u => u.plan !== 'Free').length} Paid Tiers
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-slate-400 text-[10px] font-mono uppercase font-extrabold">Total Circulation</div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {(usersList || []).reduce((sum, u) => sum + u.studyCoinBalance, 0)} Coins
              </div>
            </div>
          </div>

          {/* Users List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-700" />
                  <span>Users, Plans & Wallet Management</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage roles, plans, quotas, and Study Coins. Role changes require confirmation.
                  {clerkSyncedAt ? ` Last sync ${new Date(clerkSyncedAt).toLocaleTimeString()}.` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:w-auto w-full">
                {onRefreshClerkUsers && (
                  <button
                    type="button"
                    onClick={onRefreshClerkUsers}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wide cursor-pointer"
                  >
                    Refresh Clerk
                  </button>
                )}
                {/* User Search */}
                <div className="relative sm:w-64 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3">User Profile</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Subscription Plan</th>
                    <th className="p-3">Mock Quota</th>
                    <th className="p-3">Coin Balance</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {user.email === BOOTSTRAP_ADMIN_EMAIL ? (
                          <span className="text-[10px] text-slate-400 font-semibold">Permanent Admin</span>
                        ) : (
                          <select
                            value={user.role}
                            disabled={userProfile.email !== BOOTSTRAP_ADMIN_EMAIL}
                            onChange={(e) => requestRoleChange(user, e.target.value as UserRole)}
                            className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="Student">Student</option>
                            <option value="Admin">Admin</option>
                            <option value="Moderator (Questions)">Moderator (Questions)</option>
                            <option value="Moderator (Billing)">Moderator (Billing)</option>
                          </select>
                        )}
                      </td>

                      <td className="p-3">
                        <select
                          value={user.plan}
                          onChange={(e) => onUpdateUserPlan(user.id, e.target.value as PlanTier)}
                          className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                        >
                          <option value="Free">Free Tier</option>
                          <option value="Premium">Standard Premium</option>
                          <option value="Unlimited">Unlimited Elite</option>
                        </select>
                      </td>

                      <td className="p-3 font-mono font-bold">
                        {user.mocksRemaining === null ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Unlimited</span>
                        ) : (
                          <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{user.mocksRemaining} Mocks Left</span>
                        )}
                      </td>

                      <td className="p-3 font-mono font-black text-amber-700">
                        {user.studyCoinBalance} Coins
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenCoinsModal(user)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Adjust Coins</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Dynamic Pricing & Plans Manager */}
      {activeTab === 'pricing' && !isQuestionsMod && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Dynamic Plans & Pricing Configurator</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage live prices in NPR, original discount prices, mock quota, and active statuses. Changes take effect instantly for all students.
                </p>
              </div>

              <button
                onClick={() => {
                  const newCode = prompt('Enter Plan Code (e.g. Pro, Pass30, Elite):', 'Pro');
                  if (!newCode) return;
                  const newName = prompt('Enter Plan Name:', 'Pro Aspirant Pass');
                  if (!newName) return;
                  const priceStr = prompt('Enter Price in NPR:', '299');
                  if (!priceStr) return;
                  const mockStr = prompt('Enter Mocks Granted (leave blank for Unlimited):', '15');

                  const newPlan: PricingPlan = {
                    id: `plan-custom-${Date.now()}`,
                    code: newCode.trim(),
                    name: newName.trim(),
                    tier: newCode.toLowerCase().includes('unlimited') ? 'Unlimited' : newCode.toLowerCase().includes('free') ? 'Free' : 'Premium',
                    priceNpr: parseInt(priceStr, 10) || 0,
                    originalPriceNpr: (parseInt(priceStr, 10) || 0) * 2,
                    mocksGranted: mockStr ? parseInt(mockStr, 10) : null,
                    coinsGranted: 150,
                    description: 'Custom tier subscription plan generated by Admin.',
                    features: [
                      `${mockStr ? `${mockStr} Mocks Granted` : 'Unlimited Mocks'}`,
                      'Full Diagnostic Score Breakdown',
                      'Formula Sheet & Save Question Desk'
                    ],
                    badgeText: 'Custom Pass',
                    status: 'active'
                  };

                  onAddPricingPlan(newPlan);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Plan</span>
              </button>
            </div>

            {/* Plans List Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {pricingPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 relative ${
                    plan.status === 'active' 
                      ? 'bg-white border-slate-200 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                        {plan.code} ({plan.tier})
                      </span>
                      <button
                        onClick={() => {
                          const updated: PricingPlan = {
                            ...plan,
                            status: plan.status === 'active' ? 'archived' : 'active'
                          };
                          onUpdatePricingPlan(updated);
                        }}
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                          plan.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {plan.status === 'active' ? 'Active' : 'Archived'}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Plan Display Title</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => onUpdatePricingPlan({ ...plan, name: e.target.value })}
                        className="w-full font-bold text-slate-900 text-sm bg-slate-50 p-1.5 rounded-lg border border-slate-200 mt-0.5 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Price (NPR)</label>
                        <input
                          type="number"
                          value={plan.priceNpr}
                          onChange={(e) => onUpdatePricingPlan({ ...plan, priceNpr: parseInt(e.target.value, 10) || 0 })}
                          className="w-full font-mono font-bold text-slate-900 text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Orig. Price</label>
                        <input
                          type="number"
                          value={plan.originalPriceNpr || 0}
                          onChange={(e) => onUpdatePricingPlan({ ...plan, originalPriceNpr: parseInt(e.target.value, 10) || 0 })}
                          className="w-full font-mono font-bold text-slate-500 text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Mocks Granted</label>
                        <input
                          type="text"
                          placeholder="null for unlimited"
                          value={plan.mocksGranted === null ? 'Unlimited' : plan.mocksGranted}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            onUpdatePricingPlan({
                              ...plan,
                              mocksGranted: val.toLowerCase() === 'unlimited' || val === '' ? null : parseInt(val, 10) || 0
                            });
                          }}
                          className="w-full font-mono text-xs font-bold text-slate-900 bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Coins Granted</label>
                        <input
                          type="number"
                          value={plan.coinsGranted}
                          onChange={(e) => onUpdatePricingPlan({ ...plan, coinsGranted: parseInt(e.target.value, 10) || 0 })}
                          className="w-full font-mono text-xs font-bold text-amber-700 bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Description</label>
                      <textarea
                        rows={2}
                        value={plan.description}
                        onChange={(e) => onUpdatePricingPlan({ ...plan, description: e.target.value })}
                        className="w-full text-xs text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 leading-normal"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {plan.id}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) {
                          onDeletePricingPlan(plan.id);
                        }
                      }}
                      className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
