import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { PaymentClaim, Question, UserProfile, UserRole } from '../types';

interface AdminPanelProps {
  userProfile: UserProfile;
  paymentClaims: PaymentClaim[];
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string, reason: string) => void;
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onBulkImportJSON: (jsonStr: string) => { successCount: number; errors: string[] };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  userProfile,
  paymentClaims,
  onApproveClaim,
  onRejectClaim,
  questions,
  onAddQuestion,
  onBulkImportJSON,
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'questions' | 'import' | 'users' | 'analytics'>('payments');
  const [inspectingClaim, setInspectingClaim] = useState<PaymentClaim | null>(null);
  const [rejectReason, setRejectReason] = useState('Reference ID mismatch');
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

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
  }
]`);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

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

  const handleRunImport = () => {
    const res = onBulkImportJSON(jsonText);
    setImportResult(res);
  };

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

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'questions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Question Bank ({questions.length})
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'import' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Bulk JSON Import
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Users & Wallets
        </button>
      </div>

      {/* TAB 1: Payment Moderation Queue */}
      {activeTab === 'payments' && (
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
      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Published Questions Repository
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Chapter</th>
                  <th className="p-3">Stem Question</th>
                  <th className="p-3 text-center">Correct</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400">{q.id}</td>
                    <td className="p-3 font-bold text-slate-900">{q.subject}</td>
                    <td className="p-3 text-slate-600">{q.chapter}</td>
                    <td className="p-3 text-slate-800 font-medium max-w-md truncate">{q.stem}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">{q.correctOptionKey}</td>
                    <td className="p-3 text-right font-mono text-[10px] font-bold text-emerald-700">
                      {q.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Bulk JSON Import */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Bulk JSON Question Import (Listing 1 PRD Schema)
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Paste valid question JSON array according to the PRD draft 2020-12 schema. Non-matching objects will generate line-by-line error messages without failing valid entries.
          </p>

          <textarea
            rows={10}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full p-4 bg-slate-950 text-cyan-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none"
          />

          <button
            onClick={handleRunImport}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Run Schema Validation & Import Batch
          </button>

          {importResult && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="font-bold text-emerald-600">Successfully Imported: {importResult.successCount} questions</div>
              {importResult.errors.length > 0 && (
                <div className="text-rose-600 font-semibold space-y-1">
                  <div>Errors ({importResult.errors.length}):</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
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
    </div>
  );
};
