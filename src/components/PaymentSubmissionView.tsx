import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  TrendingUp,
  Percent,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PaymentClaim, UserProfile, PricingPlan } from '../types';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';
interface PaymentSubmissionViewProps {
  userProfile: UserProfile;
  claimsHistory: PaymentClaim[];
  onSubmitClaim: (
    claim: Omit<PaymentClaim, 'id' | 'status' | 'submittedAt'>
  ) => void | Promise<void>;
  pricingPlans: PricingPlan[];
}

export const PaymentSubmissionView: React.FC<PaymentSubmissionViewProps> = ({
  userProfile,
  claimsHistory,
  onSubmitClaim,
  pricingPlans = [],
}) => {
  const feedback = useFeedback();
  const activePlans = (pricingPlans || []).filter((p) => p.status === 'active');
  const defaultPaidPlan = activePlans.find((p) => p.priceNpr > 0) || activePlans[0];
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(
    () => defaultPaidPlan?.code || 'Premium'
  );
  const [paymentMethod, setPaymentMethod] = useState<'eSewa' | 'Khalti' | 'Bank Transfer'>('eSewa');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('https://images.unsplash.com/photo-1556742049-0a67d512a95e?auto=format&fit=crop&w=600&q=80');
  const [userNotes, setUserNotes] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // FAQ collapse state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const selectedPlanObj =
    activePlans.find(
      (p) => p.code === selectedPlanCode || p.id === selectedPlanCode || p.tier === selectedPlanCode
    ) || defaultPaidPlan;
  const amount = selectedPlanObj ? selectedPlanObj.priceNpr : 0;
  const selectedPlanLabel = selectedPlanObj?.name || selectedPlanObj?.code || 'Select a plan';
  const upgradeCtaPlan =
    activePlans.find((p) => p.isPopular && p.priceNpr > 0) ||
    activePlans.find((p) => p.priceNpr > 0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanObj || selectedPlanObj.priceNpr <= 0) {
      await feedback.alert({
        variant: 'warning',
        title: 'Select a paid plan',
        message: 'Choose a paid plan before submitting a payment claim.',
      });
      return;
    }
    if (!transactionRef.trim()) {
      await feedback.alert({
        variant: 'warning',
        title: 'Reference ID required',
        message: 'Enter the payment reference / transaction ID from your eSewa, Khalti, or bank receipt.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitClaim({
        userId: userProfile.id,
        userName: userProfile.name,
        userEmail: userProfile.email,
        planCode: selectedPlanObj.code,
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
    } catch {
      /* parent surfaces errors */
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  const faqs = [
    {
      q: "Can I upgrade my subscription plan later?",
      a: "Yes! You can upgrade your plan or purchase additional mock credits at any time. When you select a plan, submit your payment reference ID for verification."
    },
    {
      q: "Can I retake a completed mock test?",
      a: "Absolutely! You can retake any unlocked mock test to practice and track improvement. Note that only your first attempt will award Study Coins to prevent reward farming."
    },
    {
      q: "Do purchased mock test quotas expire?",
      a: "No. Standard Plan mock credits remain active and valid in your wallet indefinitely. Under the Unlimited Plan, mock access is active for your full preparation term."
    },
    {
      q: "What happens if my payment claim is rejected?",
      a: "If a moderator rejects your payment claim (due to a typo in the Reference ID or incorrect amount), your plan status will remain unchanged. You can review the rejection reason in your history log and submit a corrected claim receipt."
    },
    {
      q: "How are Study Coins earned and spent?",
      a: "You earn coins by completing mock tests, achieving personal best scores, and resolving weekly challenges. You can redeem coins in the Wallet page to unlock extra mock test sets or high-yield chapter packs."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 font-sans select-none">
      
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-4">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Plans and payment
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Pick a plan, pay with eSewa, Khalti, or bank transfer, then submit your transaction reference for verification.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              Current plan: <span className="font-semibold text-slate-900">{userProfile.plan}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              Mocks left:{' '}
              <span className="font-semibold font-mono text-slate-900">
                {userProfile.mocksRemaining !== null ? userProfile.mocksRemaining : 'Unlimited'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC PRICING CARDS (from Admin-managed pricingPlans) */}
      {activePlans.length === 0 ? (
        <section className="bg-white rounded-2xl border border-amber-200 p-6 text-center space-y-2 shadow-xs">
          <AppIcon icon={AlertCircle} size="card" className="text-amber-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No active plans published</h3>
          <p className="text-xs text-slate-500 font-medium">
            An admin needs to activate pricing plans before checkout is available.
          </p>
        </section>
      ) : (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activePlans.map((plan) => {
          const isCurrent = userProfile.plan === plan.tier || userProfile.plan === plan.code;
          const isFree = plan.priceNpr === 0 || plan.tier === 'Free';
          const isUnlimited = plan.tier === 'Unlimited';

          return (
            <div 
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all space-y-6 relative ${
                plan.isPopular 
                  ? 'bg-white border-2 border-blue-600 shadow-lg hover:shadow-xl'
                  : isUnlimited
                  ? 'bg-slate-950 text-white border border-slate-800 hover:border-slate-700 shadow-xl'
                  : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md text-slate-900'
              }`}
            >
              {plan.badgeText && (
                <div className={`absolute top-0 right-6 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full font-mono ${
                  plan.isPopular ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  {plan.badgeText}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-extrabold tracking-wider">
                    {plan.tier} Access
                  </span>
                  <h3 className={`text-lg font-black mt-1 ${isUnlimited ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                </div>

                <div className={`flex items-baseline font-mono ${isUnlimited ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-3xl font-black">Rs. {plan.priceNpr}</span>
                  {plan.originalPriceNpr && plan.originalPriceNpr > plan.priceNpr ? (
                    <span className="text-xs text-slate-400 line-through font-mono ml-2">
                      Rs. {plan.originalPriceNpr}
                    </span>
                  ) : null}
                  <span className="text-xs text-slate-400 font-sans ml-1">
                    {isFree ? '/ forever' : plan.mocksGranted === null ? '/ full term' : `/ ${plan.mocksGranted} mocks quota`}
                  </span>
                </div>

                <p className={`text-xs leading-relaxed font-medium ${isUnlimited ? 'text-slate-300' : 'text-slate-500'}`}>
                  {plan.description}
                </p>

                <ul className={`space-y-2 text-xs font-semibold list-none ${isUnlimited ? 'text-slate-300' : 'text-slate-600'}`}>
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <AppIcon
                        icon={CheckCircle2}
                        size="btn"
                        className={
                          isUnlimited ? 'text-amber-400' : plan.isPopular ? 'text-blue-600' : 'text-slate-400'
                        }
                      /> 
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isFree ? (
                <button 
                  disabled 
                  className="w-full py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed text-center border border-slate-200"
                >
                  {isCurrent ? 'Active Free Tier' : 'Default Tier'}
                </button>
              ) : (
                <button 
                  disabled={isCurrent}
                  onClick={() => {
                    setSelectedPlanCode(plan.code);
                    document.getElementById('claim-form-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-2.5 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer text-center disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${
                    plan.isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : isUnlimited
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCurrent ? 'Your Current Plan' : `Subscribe for Rs. ${plan.priceNpr}`}
                </button>
              )}
            </div>
          );
        })}
      </section>
      )}

      {/* 3. DETAILED PLAN COMPARISON (driven by pricingPlans) */}
      {activePlans.length > 0 && (
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Plan Feature Comparison Matrix</h3>
        <div className="overflow-x-auto scroll-x-safe">
          <table className="w-full text-left text-xs border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                <th className="p-3">Core Features</th>
                {activePlans.map((plan) => (
                  <th key={plan.id} className={`p-3 ${plan.isPopular ? 'font-bold text-slate-950' : ''}`}>
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="p-3 font-bold text-slate-800">Price (NPR)</td>
                {activePlans.map((plan) => (
                  <td key={`${plan.id}-price`} className="p-3 font-mono font-bold">
                    {plan.priceNpr === 0 ? 'Free' : `Rs. ${plan.priceNpr}`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800">Mock Quota</td>
                {activePlans.map((plan) => (
                  <td key={`${plan.id}-mocks`} className="p-3">
                    {plan.mocksGranted === null ? (
                      <span className="text-amber-600 font-black">Unlimited</span>
                    ) : (
                      `${plan.mocksGranted} Credits`
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800">Study Coins Granted</td>
                {activePlans.map((plan) => (
                  <td key={`${plan.id}-coins`} className="p-3 font-mono">
                    {plan.coinsGranted}
                  </td>
                ))}
              </tr>
              {Array.from(
                new Set(activePlans.flatMap((p) => p.features || []))
              ).map((feature) => (
                <tr key={feature}>
                  <td className="p-3 font-bold text-slate-800">{feature}</td>
                  {activePlans.map((plan) => {
                    const included = (plan.features || []).includes(feature);
                    return (
                      <td key={`${plan.id}-${feature}`} className="p-3">
                        {included ? (
                          <span className="text-emerald-600 font-bold">Included</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* 4. WHY UPGRADE? */}
      <section className="space-y-6">
        <h3 className="font-black text-slate-900 text-lg text-center">Why Upgrade Your Preparation?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AppIcon icon={ShieldCheck} size="card" className="text-blue-600" />
              <span>Real CEE Exam Experience</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Timed count, pagination of 20 MCQs, and negative marking replicate the actual entrance hall atmosphere.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AppIcon icon={TrendingUp} size="card" className="text-blue-600" />
              <span>Granular Performance Reports</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Analyze mistakes by subject and chapter to target areas needing revision before the final exam date.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AppIcon icon={Percent} size="card" className="text-blue-600" />
              <span>Rank Prediction Percentiles</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Estimate your national rank bands compared to other medical and nursing aspirants dynamically.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AppIcon icon={BookOpen} size="card" className="text-blue-600" />
              <span>Affordable MEC Prep</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Standard plans are priced to match Nepalese student budgets without sacrificing interface quality.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AppIcon icon={CreditCard} size="card" className="text-blue-600" />
              <span>Study Coins Habit Loop</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Earn coins with every mock attempt and redeem them for formula packages or targeted study packs.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AppIcon icon={Clock} size="card" className="text-blue-600" />
              <span>Auto-Save Integrity</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Focus entirely on solving stems; the system backs up your answers to avoid loss during disconnects.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PAYMENT METHODS & QR VERIFICATION */}
      <section id="claim-form-section" className="space-y-6">
        <h3 className="font-black text-slate-900 text-lg text-center">3. Secure checkout options</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left QR details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Scan Merchant QR</span>
                <span className="text-xs font-mono text-emerald-600 font-bold">Selected Plan: {selectedPlanLabel} (NPR {amount})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="bg-slate-950 p-4 rounded-2xl text-center text-white space-y-2 border border-slate-800">
                  <div className="bg-white p-3 rounded-xl inline-block">
                    <div className="w-32 h-32 bg-slate-900 p-2 rounded flex flex-col justify-between items-center text-[8px] font-mono text-cyan-400">
                      <div className="w-full flex justify-between">
                        <div className="w-6 h-6 border-2 border-cyan-400" />
                        <div className="w-6 h-6 border-2 border-cyan-400" />
                      </div>
                      <div className="text-center font-bold text-white tracking-widest text-[10px]">
                        PrepX QR
                      </div>
                      <div className="w-full flex justify-between">
                        <div className="w-6 h-6 border-2 border-cyan-400" />
                        <div className="w-6 h-6 border-2 border-cyan-400" />
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-300">Scan via eSewa or Khalti</div>
                </div>

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
                    <div className="text-[10px] text-slate-500">Name: PrepX Nepal Pvt Ltd</div>
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
                    <div className="text-[10px] text-slate-500">Name: PrepX Nepal</div>
                  </div>
                </div>
              </div>

              {/* Gateway Placeholders */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-mono font-bold text-slate-400">
                <span>Supported: eSewa</span>
                <span>•</span>
                <span>Khalti</span>
                <span>•</span>
                <span className="opacity-50">Fonepay (Coming Soon)</span>
              </div>
            </div>
          </div>

          {/* Verification Claim Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Submit Payment Receipt Form
            </h3>

            {submittedSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2">
                <AppIcon icon={CheckCircle2} size="card" className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Claim Submitted Successfully!</span>
                  <span>Our active moderators will verify your payment reference ID within 2 hours.</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Payment Gateway Used:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="eSewa">eSewa Mobile Wallet</option>
                  <option value="Khalti">Khalti Digital Wallet</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 font-sans">User Remarks (Optional):</label>
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
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting
                  ? 'Submitting…'
                  : `Submit Verification Claim (NPR ${amount})`}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="font-black text-slate-900 text-lg text-center">Frequently Asked Questions</h3>
        <div className="divide-y divide-slate-100 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4 space-y-2">
              <button 
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaqIndex === idx ? <AppIcon icon={ChevronUp} size="btn" className="text-slate-400" /> : <AppIcon icon={ChevronDown} size="btn" className="text-slate-400" />}
              </button>
              {openFaqIndex === idx && (
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pl-1">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#2563EB] text-white rounded-2xl p-8 sm:p-10 space-y-4 border border-blue-700">
        <div className="max-w-xl space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Need more mock quota?</h2>
          <p className="text-sm text-blue-100 leading-relaxed">
            Choose a paid plan above, complete payment, then submit your transaction reference for verification.
          </p>
          {upgradeCtaPlan ? (
            <button 
              type="button"
              onClick={() => {
                setSelectedPlanCode(upgradeCtaPlan.code);
                document.getElementById('claim-form-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-white text-[#2563EB] hover:bg-slate-50 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Select {upgradeCtaPlan.name}
            </button>
          ) : null}
        </div>
      </section>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 text-base pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span>Payment claims</span>
          <span className="text-xs text-slate-500">Typical review within 2 hours</span>
        </h3>

        {claimsHistory.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No payment claims yet.</p>
        ) : (
          <div className="overflow-x-auto scroll-x-safe">
            <table className="w-full text-left text-xs border-collapse min-w-[560px]">
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
        )}
      </div>

    </div>
  );
};
