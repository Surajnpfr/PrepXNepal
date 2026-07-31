import React, { useState } from 'react';
import { 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  QrCode, 
  Copy, 
  ShieldCheck, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { PaymentClaim, UserProfile } from '../types';

interface PaymentSubmissionViewProps {
  userProfile: UserProfile;
  claimsHistory: PaymentClaim[];
  onSubmitClaim: (claim: Omit<PaymentClaim, 'id' | 'status' | 'submittedAt'>) => void;
}

export const PaymentSubmissionView: React.FC<PaymentSubmissionViewProps> = ({
  userProfile,
  claimsHistory,
  onSubmitClaim,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'Premium' | 'Unlimited'>('Premium');
  const [paymentMethod, setPaymentMethod] = useState<'eSewa' | 'Khalti' | 'Bank Transfer'>('eSewa');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('https://images.unsplash.com/photo-1556742049-0a67d512a95e?auto=format&fit=crop&w=600&q=80');
  const [userNotes, setUserNotes] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const amount = selectedPlan === 'Premium' ? 149 : 999;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      alert('Please enter your payment reference transaction ID from eSewa/Khalti receipt.');
      return;
    }

    onSubmitClaim({
      userId: userProfile.id,
      userName: userProfile.name,
      userEmail: userProfile.email,
      planCode: selectedPlan,
      amountNpr: amount,
      paymentMethod,
      transactionRef: transactionRef.trim(),
      screenshotUrl,
      userNotes: userNotes.trim(),
    });

    setSubmittedSuccess(true);
    setTransactionRef('');
    setUserNotes('');
    setTimeout(() => setSubmittedSuccess(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Manual Payment & Subscription Claims
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Transfer funds via eSewa, Khalti, or Bank QR code and submit your reference receipt ID for moderator verification within 2 hours.
        </p>
      </div>

      {/* Grid: Plan Selector & Transfer QR Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 1: Plan Summary Panel */}
        <div className="lg:col-span-6 space-y-6">
          <h2 className="font-bold text-slate-900 text-lg">1. Choose Subscription Tier</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Premium Plan Card */}
            <div 
              onClick={() => setSelectedPlan('Premium')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative ${
                selectedPlan === 'Premium' 
                  ? 'border-blue-600 bg-blue-50/50 shadow-md' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 text-sm">Premium Plan</span>
                <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Rs. 149
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">10 CEE Mocks</div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Full Scored Reports & Rank</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Weak Chapter Analytics</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Redeemable Revision Packs</li>
              </ul>
            </div>

            {/* Unlimited Plan Card */}
            <div 
              onClick={() => setSelectedPlan('Unlimited')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative ${
                selectedPlan === 'Unlimited' 
                  ? 'border-amber-500 bg-amber-50/50 shadow-md' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-900 text-sm">Unlimited Plan</span>
                <span className="text-xs font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                  Rs. 999
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">Unlimited Access</div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Unlimited CEE & IOE Mocks</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> All Past Official Papers (PYP)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Priority Moderator Verification</li>
              </ul>
            </div>
          </div>

          {/* Transfer Details & QR Code Display */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>2. Merchant Transfer QR & Accounts</span>
              <span className="text-xs font-mono text-emerald-600 font-bold">Amount: NPR {amount}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* QR Visual */}
              <div className="bg-slate-950 p-4 rounded-2xl text-center text-white space-y-2 border border-slate-800">
                <div className="bg-white p-3 rounded-xl inline-block shadow-inner">
                  {/* Generated QR Mock Canvas */}
                  <div className="w-32 h-32 bg-slate-900 p-2 rounded flex flex-col justify-between items-center text-[8px] font-mono text-cyan-400">
                    <div className="w-full flex justify-between">
                      <div className="w-6 h-6 border-2 border-cyan-400" />
                      <div className="w-6 h-6 border-2 border-cyan-400" />
                    </div>
                    <div className="text-center font-bold text-white tracking-widest text-[10px]">
                      eSewa / Khalti
                    </div>
                    <div className="w-full flex justify-between">
                      <div className="w-6 h-6 border-2 border-cyan-400" />
                      <div className="w-6 h-6 border-2 border-cyan-400" />
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-300">Scan via eSewa or Khalti</div>
              </div>

              {/* Account Credentials */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-mono">eSewa ID:</div>
                  <div className="font-mono font-bold text-slate-900 text-sm flex items-center justify-between">
                    <span>9801234567</span>
                    <button 
                      onClick={() => handleCopy('9801234567')}
                      className="text-blue-600 hover:underline text-[10px] font-bold cursor-pointer"
                    >
                      {copiedRef ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">Merchant Name: PrepX Nepal Pvt Ltd</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-mono">Khalti ID:</div>
                  <div className="font-mono font-bold text-slate-900 text-sm flex items-center justify-between">
                    <span>9801234567</span>
                    <button 
                      onClick={() => handleCopy('9801234567')}
                      className="text-purple-600 hover:underline text-[10px] font-bold cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">Merchant: PrepX Nepal</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2: Verification Claim Submission Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-lg pb-2 border-b border-slate-100">
            3. Submit Payment Verification Claim
          </h2>

          {submittedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Claim Submitted Successfully!</span>
                <span>Our active moderators will verify your payment reference ID within 2 hours.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Payment Method Used:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="eSewa">eSewa Wallet Transfer</option>
                <option value="Khalti">Khalti Digital Wallet</option>
                <option value="Bank Transfer">Direct Bank Transfer</option>
              </select>
            </div>

            {/* Reference Transaction ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Reference Transaction ID *:</label>
              <input
                type="text"
                required
                placeholder="e.g. ESWA-20260730-88192 or KHLT-99210"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-500">Copy exact transaction code from your eSewa/Khalti receipt</span>
            </div>

            {/* Screenshot Upload Visual */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Upload Screenshot Proof (PDF, JPG, PNG up to 5MB):</label>
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-blue-600">Click to attach screenshot</span> or drag file here
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Sample proof pre-loaded for preview</div>
              </div>
            </div>

            {/* User Remarks */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">User Notes (Optional):</label>
              <textarea
                rows={2}
                placeholder="Add optional notes or remarks for moderator..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Submit Verification Claim (NPR {amount})
            </button>
          </form>
        </div>
      </div>

      {/* Claims History Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Prior Submission Claims Log</span>
          <span className="text-xs text-slate-500 font-mono">Moderator SLA &le; 2 Hours</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                <th className="p-3">Submitted At</th>
                <th className="p-3">Plan Tier</th>
                <th className="p-3">Method</th>
                <th className="p-3 font-mono">Reference ID</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claimsHistory.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 font-mono">{claim.submittedAt}</td>
                  <td className="p-3 font-bold text-slate-900">{claim.planCode}</td>
                  <td className="p-3 text-slate-600">{claim.paymentMethod}</td>
                  <td className="p-3 font-mono text-slate-800">{claim.transactionRef}</td>
                  <td className="p-3 text-right font-mono font-bold">NPR {claim.amountNpr}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                      claim.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : claim.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {claim.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
