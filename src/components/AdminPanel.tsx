import React, { useRef, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Upload, 
  Users, 
  Coins, 
  FileCode, 
  Sliders, 
  AlertCircle,
  Search,
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  Tag,
  RotateCcw,
  Link2,
  X,
  Bug,
} from 'lucide-react';
import { PaymentClaim, Question, UserProfile, UserRole, PlanTier, PricingPlan, MockTest, MockScope, FormulaSheet } from '../types';
import { BOOTSTRAP_ADMIN_EMAIL, ROLE_CONFIRM_PHRASE } from '../lib/clerkUserMapper';
import type { PaymentClaimEditInput } from '../lib/paymentClaimsApi';
import type { MockImportBatch } from '../lib/mocksApi';
import type { ChapterQuestionCount, ImportBatch, SubjectQuestionCount } from '../lib/questionsApi';
import type { FormulaImportBatch } from '../lib/formulasApi';
import { useFeedback } from './FeedbackProvider';
import { AdminMocksPanel } from './AdminMocksPanel';
import { AdminFormulasPanel } from './AdminFormulasPanel';
import { SubjectQuestionsPieChart } from './SubjectQuestionsPieChart';
import { AppIcon } from './ui';
import { ReferralPanel } from './ReferralPanel';
import { AdminSupportIssuesPanel } from './AdminSupportIssuesPanel';
import { AdminPromoCodesPanel } from './AdminPromoCodesPanel';

const PAYMENT_METHODS: PaymentClaim['paymentMethod'][] = [
  'Fonepay',
  'eSewa',
  'Khalti',
  'Bank Transfer',
];

interface AdminPanelProps {
  userProfile: UserProfile;
  paymentClaims: PaymentClaim[];
  paymentClaimsLoading?: boolean;
  paymentClaimsError?: string | null;
  paymentClaimsSyncedAt?: string | null;
  onRefreshPaymentClaims?: () => void;
  onApproveClaim: (claimId: string) => void | Promise<void>;
  onRejectClaim: (claimId: string, reason: string) => void | Promise<void>;
  onUpdateClaim?: (claimId: string, patch: PaymentClaimEditInput) => void | Promise<PaymentClaim | void>;
  onDeleteClaim?: (claimId: string) => void | Promise<void>;
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
  formulaSheets?: FormulaSheet[];
  formulaBatches?: FormulaImportBatch[];
  formulasLoading?: boolean;
  formulasError?: string | null;
  onImportFormulaSheets?: (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => Promise<{
    successCount: number;
    errors: string[];
    batchId: string | null;
    batch?: FormulaImportBatch | null;
  }>;
  onDeleteFormulaBatch?: (batchId: string) => Promise<void>;
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
  paymentClaimsLoading,
  paymentClaimsError,
  paymentClaimsSyncedAt,
  onRefreshPaymentClaims,
  onApproveClaim,
  onRejectClaim,
  onUpdateClaim,
  onDeleteClaim,
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
  formulaSheets = [],
  formulaBatches = [],
  formulasLoading,
  formulasError,
  onImportFormulaSheets,
  onDeleteFormulaBatch,
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
  const feedback = useFeedback();
  const isQuestionsMod = userProfile.role === 'Moderator (Questions)';
  const isBillingMod = userProfile.role === 'Moderator (Billing)';
  const isAdmin =
    userProfile.role === 'Admin' || userProfile.email === BOOTSTRAP_ADMIN_EMAIL;
  const canEditQuestions =
    userProfile.role === 'Admin' ||
    userProfile.role === 'Moderator (Questions)' ||
    userProfile.email === BOOTSTRAP_ADMIN_EMAIL;

  const [activeTab, setActiveTab] = useState<
    | 'payments'
    | 'questions'
    | 'import'
    | 'mocks'
    | 'formulas'
    | 'users'
    | 'pricing'
    | 'promos'
    | 'referrals'
    | 'issues'
  >(() => {
    if (isQuestionsMod) return 'questions';
    return 'payments';
  });
  const [inspectingClaim, setInspectingClaim] = useState<PaymentClaim | null>(null);
  const [inspectRemarksDraft, setInspectRemarksDraft] = useState('');
  const [inspectRemarksBusy, setInspectRemarksBusy] = useState(false);
  const [inspectRemarksError, setInspectRemarksError] = useState<string | null>(null);
  const [editingClaim, setEditingClaim] = useState<PaymentClaim | null>(null);
  const [editClaimBusy, setEditClaimBusy] = useState(false);
  const [editClaimError, setEditClaimError] = useState<string | null>(null);
  const [editClaimForm, setEditClaimForm] = useState({
    planCode: '',
    amountNpr: '',
    listAmountNpr: '',
    promoCode: '',
    promoDiscountNpr: '',
    paymentMethod: 'Fonepay' as PaymentClaim['paymentMethod'],
    transactionRef: '',
    screenshotUrl: '',
    userNotes: '',
  });
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
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanCode, setNewPlanCode] = useState('Pro');
  const [newPlanName, setNewPlanName] = useState('Pro Aspirant Pass');
  const [newPlanPrice, setNewPlanPrice] = useState('299');
  const [newPlanMocks, setNewPlanMocks] = useState('15');
  const [newPlanError, setNewPlanError] = useState<string | null>(null);

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
  // Server already returns FIFO pending-first; keep client sort as safety net.
  const queueClaims = [...paymentClaims].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    if (a.status === 'pending' && b.status === 'pending') {
      return a.submittedAt.localeCompare(b.submittedAt);
    }
    return b.submittedAt.localeCompare(a.submittedAt);
  });

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleApprove = async (claimId: string) => {
    await onApproveClaim(claimId);
    setInspectingClaim(null);
  };

  const handleReject = async (claimId: string) => {
    const finalReason =
      rejectReason === 'Custom Note' ? customRejectNote.trim() : rejectReason.trim();
    if (!finalReason) {
      await feedback.alert({
        variant: 'warning',
        title: 'Rejection reason required',
        message: 'Select a reason or type a custom note so the student can see why the claim was rejected.',
      });
      return;
    }
    await onRejectClaim(claimId, finalReason);
    setInspectingClaim(null);
  };

  const openInspectClaim = (claim: PaymentClaim) => {
    setInspectRemarksError(null);
    setInspectRemarksDraft(claim.userNotes ?? '');
    setInspectingClaim(claim);
  };

  const handleSaveInspectRemarks = async () => {
    if (!inspectingClaim || !onUpdateClaim) return;
    const nextNotes = inspectRemarksDraft.trim() || null;
    const prevNotes = inspectingClaim.userNotes?.trim() || null;
    if (nextNotes === prevNotes) {
      feedback.toast({ variant: 'info', message: 'No remark changes to save.' });
      return;
    }
    setInspectRemarksBusy(true);
    setInspectRemarksError(null);
    try {
      const updated = await onUpdateClaim(inspectingClaim.id, { userNotes: nextNotes });
      if (updated && typeof updated === 'object' && 'id' in updated) {
        setInspectingClaim(updated as PaymentClaim);
        setInspectRemarksDraft((updated as PaymentClaim).userNotes ?? '');
      } else {
        setInspectingClaim((c) =>
          c ? { ...c, userNotes: nextNotes ?? undefined } : c
        );
      }
    } catch (err: any) {
      setInspectRemarksError(err?.message || 'Could not save remarks');
    } finally {
      setInspectRemarksBusy(false);
    }
  };

  const openEditClaim = (claim: PaymentClaim) => {
    setInspectingClaim(null);
    setEditClaimError(null);
    setEditingClaim(claim);
    setEditClaimForm({
      planCode: claim.planCode,
      amountNpr: String(claim.amountNpr),
      listAmountNpr:
        claim.listAmountNpr != null && Number.isFinite(claim.listAmountNpr)
          ? String(claim.listAmountNpr)
          : '',
      promoCode: claim.promoCode ?? '',
      promoDiscountNpr:
        claim.promoDiscountNpr != null && Number.isFinite(claim.promoDiscountNpr)
          ? String(claim.promoDiscountNpr)
          : '0',
      paymentMethod: claim.paymentMethod,
      transactionRef: claim.transactionRef,
      screenshotUrl: claim.screenshotUrl ?? '',
      userNotes: claim.userNotes ?? '',
    });
  };

  const handleSaveEditedClaim = async () => {
    if (!editingClaim || !onUpdateClaim) return;
    const planCode = editClaimForm.planCode.trim();
    const transactionRef = editClaimForm.transactionRef.trim();
    const amountNpr = Number(editClaimForm.amountNpr);
    if (!planCode) {
      setEditClaimError('Plan code is required.');
      return;
    }
    if (!Number.isFinite(amountNpr) || amountNpr <= 0) {
      setEditClaimError('Amount must be a positive number.');
      return;
    }
    if (!transactionRef) {
      setEditClaimError('Transaction reference is required.');
      return;
    }
    const listRaw = editClaimForm.listAmountNpr.trim();
    let listAmountNpr: number | null | undefined = undefined;
    if (listRaw === '') {
      listAmountNpr = null;
    } else {
      const list = Number(listRaw);
      if (!Number.isFinite(list) || list <= 0) {
        setEditClaimError('List amount must be a positive number (or empty).');
        return;
      }
      listAmountNpr = Math.round(list);
    }
    const promoDiscount = Number(editClaimForm.promoDiscountNpr || '0');
    if (!Number.isFinite(promoDiscount) || promoDiscount < 0) {
      setEditClaimError('Promo discount must be ≥ 0.');
      return;
    }

    const patch: PaymentClaimEditInput = {
      planCode,
      amountNpr: Math.round(amountNpr),
      listAmountNpr,
      promoCode: editClaimForm.promoCode.trim() || null,
      promoDiscountNpr: Math.round(promoDiscount),
      paymentMethod: editClaimForm.paymentMethod,
      transactionRef,
      userNotes: editClaimForm.userNotes.trim() || null,
    };
    const shot = editClaimForm.screenshotUrl.trim();
    if (shot) patch.screenshotUrl = shot;

    setEditClaimBusy(true);
    setEditClaimError(null);
    try {
      await onUpdateClaim(editingClaim.id, patch);
      setEditingClaim(null);
    } catch (err: any) {
      setEditClaimError(err?.message || 'Could not update claim');
    } finally {
      setEditClaimBusy(false);
    }
  };

  const handleDeletePendingClaim = async (claim: PaymentClaim) => {
    if (!onDeleteClaim) return;
    const ok = await feedback.confirm({
      destructive: true,
      title: 'Delete pending claim?',
      message: `Remove ${claim.userName}'s ${claim.planCode} claim (NPR ${claim.amountNpr}, ref ${claim.transactionRef}) from the FIFO queue? This cannot be undone.`,
      confirmLabel: 'Delete claim',
    });
    if (!ok) return;
    try {
      await onDeleteClaim(claim.id);
      if (inspectingClaim?.id === claim.id) setInspectingClaim(null);
      if (editingClaim?.id === claim.id) setEditingClaim(null);
    } catch {
      /* App handler already alerts */
    }
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
    const ok = await feedback.confirm({
      title: 'Delete question?',
      message: q.stem.slice(0, 160),
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await onDeleteQuestion(q.id);
      feedback.toast({ message: 'Question deleted.', variant: 'success' });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Delete failed',
        message: err?.message || 'Failed to delete question',
      });
    }
  };

  const handleDeleteBatchClick = async (batch: ImportBatch, opts?: { asUndo?: boolean }) => {
    if (!canEditQuestions) return;
    const asUndo = Boolean(opts?.asUndo);
    const ok = await feedback.confirm({
      title: asUndo ? 'Undo this import?' : 'Delete entire batch?',
      message: asUndo
        ? `Batch: ${batch.label}\nImported by: ${batch.importedByName}\nThis removes all ${batch.questionCount} questions from that import.`
        : `Delete batch “${batch.label}” and all ${batch.questionCount} questions in it?`,
      confirmLabel: asUndo ? 'Undo import' : 'Delete batch',
      destructive: true,
    });
    if (!ok) return;
    setUndoBusy(true);
    try {
      await onDeleteQuestionBatch(batch.id);
      if (importResult?.batchId === batch.id) {
        setImportResult(null);
      }
      feedback.toast({ message: asUndo ? 'Import undone.' : 'Batch deleted.', variant: 'success' });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Action failed',
        message: err?.message || 'Failed to undo/delete batch',
      });
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
      await feedback.alert({
        variant: 'warning',
        title: 'Nothing to undo',
        message: 'No import batch available to undo.',
      });
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
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full mb-2">
            <AppIcon icon={Sliders} size="btn" className="text-rose-600 shrink-0" />
            <span className="truncate">Moderator & Admin Operations Control</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            PrepX Nepal Admin Panel
          </h1>
        </div>

        <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2 self-start sm:self-auto shrink-0">
          <AppIcon icon={ShieldCheck} size="btn" className="text-emerald-400" />
          <span>Level: {userProfile.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="scroll-x-safe flex items-center gap-2 border-b border-slate-200 pb-3 font-bold text-xs -mx-1 px-1">
        {!isQuestionsMod && (
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'payments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Payment Moderation Queue</span>
            {pendingClaims.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingClaims.length}
              </span>
            )}
          </button>
        )}

        {!isBillingMod && (
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'questions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Question Bank ({questions.length})
          </button>
        )}

        {!isBillingMod && (
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'import' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bulk JSON Import
          </button>
        )}

        {!isBillingMod && (
          <button
            type="button"
            onClick={() => setActiveTab('mocks')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'mocks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mock Tests ({mockTests.length})
          </button>
        )}

        {!isBillingMod && onImportFormulaSheets && onDeleteFormulaBatch && (
          <button
            type="button"
            onClick={() => setActiveTab('formulas')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'formulas' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Formula Batches ({formulaSheets.length})
          </button>
        )}

        {!isQuestionsMod && (
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Users & Wallets
          </button>
        )}

        {!isQuestionsMod && (
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'pricing' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AppIcon icon={Sliders} size="btn" />
            <span>Pricing & Plans Manager</span>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'promos' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AppIcon icon={Tag} size="btn" />
            <span>Promo Codes</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'referrals' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AppIcon icon={Link2} size="btn" />
          <span>Referrals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'issues' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AppIcon icon={Bug} size="btn" />
          <span>Support Issues</span>
        </button>
      </div>

      {/* TAB 1: Payment Moderation Queue (server-backed, dynamic) */}
      {activeTab === 'payments' && !isQuestionsMod && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span>Pending Manual Payment Claims Queue (FIFO)</span>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Dynamic
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">SLA Goal &le; 2 Hours</span>
              {onRefreshPaymentClaims ? (
                <button
                  type="button"
                  onClick={() => onRefreshPaymentClaims()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <AppIcon icon={RotateCcw} size="btn" className={paymentClaimsLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              ) : null}
            </div>
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span>
              Pending: <strong className="text-slate-800">{pendingClaims.length}</strong>
            </span>
            {paymentClaimsSyncedAt ? (
              <span>
                Synced: {new Date(paymentClaimsSyncedAt).toLocaleTimeString()} (auto every 15s)
              </span>
            ) : null}
          </div>

          {paymentClaimsError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {paymentClaimsError}
            </div>
          ) : null}

          {paymentClaimsLoading && queueClaims.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading claims…</p>
          ) : queueClaims.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No payment claims yet.</p>
          ) : (
          <div className="overflow-x-auto scroll-x-safe">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
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
                {queueClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{claim.userName}</div>
                      <div className="text-[10px] text-slate-500">{claim.userEmail}</div>
                      {claim.userNotes?.trim() ? (
                        <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-1.5 py-0.5 line-clamp-2 max-w-[200px]">
                          Note: {claim.userNotes}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3 font-bold text-blue-600">{claim.planCode}</td>
                    <td className="p-3 text-slate-700">{claim.paymentMethod}</td>
                    <td className="p-3 font-mono text-slate-800">{claim.transactionRef}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      NPR {claim.amountNpr}
                      {claim.promoCode ? (
                        <div className="text-[10px] font-sans font-semibold text-emerald-700">
                          {claim.promoCode}
                          {claim.promoDiscountNpr
                            ? ` (−${claim.promoDiscountNpr})`
                            : ''}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3 text-right">
                      {claim.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openInspectClaim(claim)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg cursor-pointer inline-flex items-center gap-1"
                          >
                            <AppIcon icon={Eye} size="btn" />
                            <span>Inspect</span>
                          </button>
                          {onUpdateClaim ? (
                            <button
                              type="button"
                              onClick={() => openEditClaim(claim)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-[11px] rounded-lg cursor-pointer inline-flex items-center gap-1"
                            >
                              <AppIcon icon={Edit3} size="btn" />
                              <span>Edit</span>
                            </button>
                          ) : null}
                          {onDeleteClaim ? (
                            <button
                              type="button"
                              onClick={() => void handleDeletePendingClaim(claim)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-lg cursor-pointer inline-flex items-center gap-1"
                            >
                              <AppIcon icon={Trash2} size="btn" />
                              <span>Delete</span>
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {claim.status.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => openInspectClaim(claim)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-[11px] rounded-lg cursor-pointer inline-flex items-center gap-1"
                            title="View claim and edit User Remarks"
                          >
                            <AppIcon icon={Eye} size="btn" />
                            <span>Remarks</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
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
                              <AppIcon icon={RotateCcw} size="btn" />
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
                      <div className="overflow-x-auto scroll-x-safe">
                        <table className="w-full text-left text-xs border-collapse min-w-[560px]">
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
                                        <AppIcon icon={Edit3} size="btn" />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteQuestionClick(q)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                      >
                                        <AppIcon icon={Trash2} size="btn" />
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
                <AppIcon icon={Upload} size="card" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Import from JSON file</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Drag &amp; drop or browse. Max 2 MB. Schema: subject, chapter, question, options, correctAnswer. Optional for MAT: <code className="font-mono">imageUrl</code>, <code className="font-mono">optionImages</code>.
                </div>
                {importFileName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700">
                    <AppIcon icon={FileCode} size="btn" />
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
                    <AppIcon icon={Clock} size="btn" />
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
                      <AppIcon icon={RotateCcw} size="btn" />
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

      {activeTab === 'formulas' &&
        !isBillingMod &&
        onImportFormulaSheets &&
        onDeleteFormulaBatch && (
          <AdminFormulasPanel
            sheets={formulaSheets}
            batches={formulaBatches}
            loading={formulasLoading}
            error={formulasError}
            canEdit={canEditQuestions}
            onImport={onImportFormulaSheets}
            onDeleteBatch={onDeleteFormulaBatch}
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
                <AppIcon icon={X} size="btn" />
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
              <div>
                <h3 className="text-lg font-black text-slate-900">Claim Inspection Modal (Split View)</h3>
                {inspectingClaim.status !== 'pending' ? (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Status: <span className="font-bold uppercase">{inspectingClaim.status}</span>
                    {' · '}User Remarks can still be edited
                  </p>
                ) : null}
              </div>
              <button 
                onClick={() => setInspectingClaim(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                <AppIcon icon={X} size="btn" />
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
                  {inspectingClaim.promoCode ? (
                    <div className="text-emerald-700 font-semibold text-xs">
                      Promo {inspectingClaim.promoCode}
                      {inspectingClaim.listAmountNpr != null
                        ? ` · list NPR ${inspectingClaim.listAmountNpr}`
                        : ''}
                      {inspectingClaim.promoDiscountNpr
                        ? ` · saved NPR ${inspectingClaim.promoDiscountNpr}`
                        : ''}
                    </div>
                  ) : null}
                  <div className="text-slate-500">Method: {inspectingClaim.paymentMethod}</div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-amber-800/70 text-[10px] uppercase font-bold">User Remarks</div>
                    {onUpdateClaim ? (
                      <button
                        type="button"
                        disabled={inspectRemarksBusy}
                        onClick={() => void handleSaveInspectRemarks()}
                        className="text-[10px] font-bold text-amber-900 hover:underline disabled:opacity-50"
                      >
                        {inspectRemarksBusy ? 'Saving…' : 'Save remarks'}
                      </button>
                    ) : null}
                  </div>
                  {onUpdateClaim ? (
                    <textarea
                      rows={4}
                      value={inspectRemarksDraft}
                      onChange={(e) => setInspectRemarksDraft(e.target.value)}
                      placeholder="No remarks — staff can add or correct notes here."
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-sans text-slate-800 resize-y"
                    />
                  ) : inspectingClaim.userNotes?.trim() ? (
                    <p className="text-slate-800 text-xs font-sans font-medium leading-relaxed whitespace-pre-wrap">
                      {inspectingClaim.userNotes}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-xs font-sans italic">No remarks provided by user.</p>
                  )}
                  {inspectRemarksError ? (
                    <p className="text-[11px] text-rose-700 font-sans">{inspectRemarksError}</p>
                  ) : null}
                </div>

                {/* Rejection Reason Selector — pending only */}
                {inspectingClaim.status === 'pending' ? (
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
                ) : inspectingClaim.moderatorNotes?.trim() ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase">Moderator notes</div>
                    <p className="text-slate-800 text-xs font-sans whitespace-pre-wrap">
                      {inspectingClaim.moderatorNotes}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Right Column: Screenshot Image Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Uploaded Receipt Screenshot Preview:</div>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-2 text-center">
                  {inspectingClaim.screenshotUrl?.trim() ? (
                    <img
                      src={inspectingClaim.screenshotUrl}
                      alt="Payment Screenshot"
                      className="max-h-64 object-contain mx-auto rounded"
                    />
                  ) : (
                    <div className="py-16 text-[11px] text-slate-400 font-mono">
                      No screenshot attached
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-100">
              {inspectingClaim.status === 'pending' ? (
                <>
                  {onUpdateClaim ? (
                    <button
                      type="button"
                      onClick={() => openEditClaim(inspectingClaim)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1"
                    >
                      <AppIcon icon={Edit3} size="btn" />
                      Edit claim
                    </button>
                  ) : null}
                  {onDeleteClaim ? (
                    <button
                      type="button"
                      onClick={() => void handleDeletePendingClaim(inspectingClaim)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1"
                    >
                      <AppIcon icon={Trash2} size="btn" />
                      Delete
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleReject(inspectingClaim.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Reject (Flag Claim)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(inspectingClaim.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Approve & Grant Entitlement
                  </button>
                </>
              ) : (
                <>
                  {onUpdateClaim ? (
                    <button
                      type="button"
                      disabled={inspectRemarksBusy}
                      onClick={() => void handleSaveInspectRemarks()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      {inspectRemarksBusy ? 'Saving…' : 'Save User Remarks'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setInspectingClaim(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit pending payment claim */}
      {editingClaim && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit pending claim</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingClaim.userName} · {editingClaim.userEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !editClaimBusy && setEditingClaim(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                <AppIcon icon={X} size="btn" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1 sm:col-span-1">
                <span className="font-bold text-slate-700">Plan code</span>
                <input
                  value={editClaimForm.planCode}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, planCode: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Payable amount (NPR)</span>
                <input
                  type="number"
                  min={1}
                  value={editClaimForm.amountNpr}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, amountNpr: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">List amount (NPR)</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Optional"
                  value={editClaimForm.listAmountNpr}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, listAmountNpr: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Payment method</span>
                <select
                  value={editClaimForm.paymentMethod}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({
                      ...f,
                      paymentMethod: e.target.value as PaymentClaim['paymentMethod'],
                    }))
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-700">Transaction ref</span>
                <input
                  value={editClaimForm.transactionRef}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, transactionRef: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Promo code</span>
                <input
                  value={editClaimForm.promoCode}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, promoCode: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Promo discount (NPR)</span>
                <input
                  type="number"
                  min={0}
                  value={editClaimForm.promoDiscountNpr}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, promoDiscountNpr: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-700">Screenshot URL</span>
                <input
                  value={editClaimForm.screenshotUrl}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, screenshotUrl: e.target.value }))
                  }
                  placeholder="https://… or data:image/…"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-700">User Remarks</span>
                <textarea
                  rows={3}
                  value={editClaimForm.userNotes}
                  onChange={(e) =>
                    setEditClaimForm((f) => ({ ...f, userNotes: e.target.value }))
                  }
                  placeholder="Student notes — editable by billing staff"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg resize-y"
                />
              </label>
            </div>

            {editClaimError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {editClaimError}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={editClaimBusy}
                onClick={() => setEditingClaim(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editClaimBusy}
                onClick={() => void handleSaveEditedClaim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl"
              >
                {editClaimBusy ? 'Saving…' : 'Save changes'}
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
                <AppIcon icon={AlertCircle} size="card" className="shrink-0" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Security Protocol: Admin Set User Coins
                </h3>
              </div>
              <button 
                onClick={() => setEditingCoinsUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <AppIcon icon={X} size="btn" />
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
                <AppIcon icon={ShieldCheck} size="btn" className="text-rose-600 shrink-0 mt-0.5" />
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
                      <AppIcon icon={CheckCircle2} size="btn" /> Name Verified
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
                      <AppIcon icon={CheckCircle2} size="btn" /> Amount Verified
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
                <AppIcon icon={Coins} size="btn" />
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
                <AppIcon icon={AlertCircle} size="card" className="shrink-0" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Confirm role change
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <AppIcon icon={X} size="btn" />
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
                <AppIcon icon={ShieldCheck} size="btn" className="text-rose-600 shrink-0 mt-0.5" />
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
                      <AppIcon icon={CheckCircle2} size="btn" /> Name verified
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
                      <AppIcon icon={CheckCircle2} size="btn" /> Phrase verified
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
              <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-600 shrink-0" />
              <span>{coinUpdateSuccessMsg}</span>
            </div>
          )}

          {roleUpdateSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs">
              <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-600 shrink-0" />
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
                  <AppIcon icon={Users} size="card" className="text-slate-700" />
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
                  <AppIcon icon={Search} size="btn" className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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

            <div className="overflow-x-auto scroll-x-safe">
              <table className="w-full text-left text-xs border-collapse min-w-[720px]">
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
                          <AppIcon icon={Coins} size="btn" />
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
                  <AppIcon icon={CreditCard} size="card" className="text-blue-600" />
                  <span>Dynamic Plans & Pricing Configurator</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage live prices in NPR, original discount prices, mock quota, and active statuses. Changes take effect instantly for all students.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewPlanCode('Pro');
                  setNewPlanName('Pro Aspirant Pass');
                  setNewPlanPrice('299');
                  setNewPlanMocks('15');
                  setNewPlanError(null);
                  setShowAddPlanModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              >
                <AppIcon icon={Plus} size="btn" />
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
                      type="button"
                      onClick={async () => {
                        const ok = await feedback.confirm({
                          title: 'Delete plan?',
                          message: `Remove “${plan.name}” from the pricing list?`,
                          confirmLabel: 'Delete plan',
                          destructive: true,
                        });
                        if (ok) onDeletePricingPlan(plan.id);
                      }}
                      className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <AppIcon icon={Trash2} size="btn" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'promos' && isAdmin && <AdminPromoCodesPanel />}

      {activeTab === 'referrals' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <ReferralPanel userProfile={userProfile} />
        </div>
      )}

      {activeTab === 'issues' && <AdminSupportIssuesPanel />}

      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close"
            onClick={() => setShowAddPlanModal(false)}
          />
          <form
            className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-lg p-5 sm:p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const code = newPlanCode.trim();
              const name = newPlanName.trim();
              const price = parseInt(newPlanPrice, 10);
              if (!code || !name) {
                setNewPlanError('Plan code and name are required.');
                return;
              }
              if (Number.isNaN(price) || price < 0) {
                setNewPlanError('Enter a valid price in NPR.');
                return;
              }
              const mocksTrim = newPlanMocks.trim();
              const mocksGranted = mocksTrim === '' ? null : parseInt(mocksTrim, 10);
              if (mocksTrim !== '' && (Number.isNaN(mocksGranted!) || mocksGranted! < 0)) {
                setNewPlanError('Mocks granted must be a number, or blank for unlimited.');
                return;
              }
              const newPlan: PricingPlan = {
                id: `plan-custom-${Date.now()}`,
                code,
                name,
                tier: code.toLowerCase().includes('unlimited')
                  ? 'Unlimited'
                  : code.toLowerCase().includes('free')
                    ? 'Free'
                    : 'Premium',
                priceNpr: price,
                originalPriceNpr: price * 2,
                mocksGranted,
                coinsGranted: 150,
                description: 'Custom subscription plan.',
                features: [
                  mocksGranted === null ? 'Unlimited mocks' : `${mocksGranted} mocks granted`,
                  'Full diagnostic score breakdown',
                  'Formula library and saved questions',
                ],
                badgeText: 'Custom',
                status: 'active',
              };
              onAddPricingPlan(newPlan);
              setShowAddPlanModal(false);
              feedback.toast({ message: `Plan “${name}” added.`, variant: 'success' });
            }}
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Add custom plan</h3>
              <p className="text-sm text-slate-600">Create a pricing tier students can purchase.</p>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Plan code</span>
              <input
                value={newPlanCode}
                onChange={(e) => setNewPlanCode(e.target.value)}
                className="w-full min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                placeholder="Pro"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Plan name</span>
              <input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="w-full min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                placeholder="Pro Aspirant Pass"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Price (NPR)</span>
                <input
                  type="number"
                  min={0}
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  className="w-full min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Mocks (blank = ∞)</span>
                <input
                  value={newPlanMocks}
                  onChange={(e) => setNewPlanMocks(e.target.value)}
                  className="w-full min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  placeholder="15"
                />
              </label>
            </div>
            {newPlanError && <p className="text-xs text-rose-600">{newPlanError}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAddPlanModal(false)}
                className="min-h-11 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Add plan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
