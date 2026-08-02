import React, { useState } from 'react';
import { 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle, 
  PhoneCall, 
  Mail, 
  ExternalLink, 
  FileText, 
  Lock, 
  Clock, 
  Coins, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Bug,
  Send
} from 'lucide-react';
import { PoliciesView } from './PoliciesView';
import { WorkflowView } from './WorkflowView';

interface HelpSupportViewProps {
  activeSubTab: 'info' | 'policies' | 'workflow' | 'terms' | 'privacy' | 'coins-policy' | 'refund' | 'faq' | 'issue';
  setActiveSubTab: (subTab: 'info' | 'policies' | 'workflow' | 'terms' | 'privacy' | 'coins-policy' | 'refund' | 'faq' | 'issue') => void;
}

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({
  activeSubTab,
  setActiveSubTab,
}) => {
  // Collapsible FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Issue Form State
  const [issueCategory, setIssueCategory] = useState('technical');
  const [issueDetails, setIssueDetails] = useState('');
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDetails.trim()) {
      alert("Please provide the details of the issue.");
      return;
    }
    setIssueSubmitted(true);
    setIssueDetails('');
    setTimeout(() => setIssueSubmitted(false), 5000);
  };

  const faqs = [
    {
      q: "How does CEE negative marking work?",
      a: "Under the Medical Education Commission (MEC) rules, each correct answer earns 1 mark, while each wrong answer deducts 0.25 marks. Unanswered questions result in 0 marks. Skipping questions you are unsure about is a key strategy to avoid point deductions."
    },
    {
      q: "Can I upgrade standard premium credits to Unlimited?",
      a: "Yes! If you purchased the Standard Plan (10 mocks credits) and want to go Unlimited, you can scan the Unlimited QR code on the plans page, send the remaining balance, and submit your reference transaction receipt claim."
    },
    {
      q: "What is the moderator verification SLA for payment receipt claims?",
      a: "Our active billing moderators verify payment claims via digital receipts within 2 hours. If your submission is sent after 10 PM, it will be prioritized and verified by 8 AM the next morning."
    },
    {
      q: "Do my study coins expire?",
      a: "No, Study Coins do not expire. You can save them in your coin wallet to unlock specialized revision files or study countdown worksheets later in the session."
    },
    {
      q: "How can I report a wrong answer explanation or typo?",
      a: "If you notice a typo or questionable explanation inside any mock question, navigate to the 'Report an Issue' sub-tab on this page, choose 'Question Content Error', enter the Mock test title/Question number, and submit it directly to our content moderators."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans select-none">
      
      {/* Top Header Tab Switcher */}
      <div className="border-b border-slate-200 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#2563EB]" />
            <span>Help Desk & Academic Regulations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse MEC CEE rules, terms of service, coin usage policies, or file a support ticket directly to Kathmandu office.
          </p>
        </div>

        {/* Tab Items */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-[11px] font-bold border border-slate-200 gap-1">
          {[
            { id: 'info', label: 'CEE Rules' },
            { id: 'workflow', label: 'Student Journey' },
            { id: 'policies', label: 'Legal SLA' },
            { id: 'faq', label: 'FAQs' },
            { id: 'terms', label: 'Terms' },
            { id: 'privacy', label: 'Privacy' },
            { id: 'coins-policy', label: 'Coins Rule' },
            { id: 'refund', label: 'Refunds' },
            { id: 'issue', label: 'Report Issue' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER DYNAMIC SUB-TABS */}
      
      {/* 1. CEE RULES */}
      {activeSubTab === 'info' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>MEC CEE 2026 Exam Structure & Rules</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700 font-semibold list-none pl-0">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span><strong>Total Questions:</strong> 200 Multiple Choice Questions (MCQs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span><strong>Duration:</strong> 3 Hours (180 Minutes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span><strong>Correct Answer:</strong> +1.0 Mark</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span><strong>Negative Marking:</strong> -0.25 Mark per wrong answer (25% penalty)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span><strong>Unanswered Question:</strong> 0 Marks (No penalty)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                <span>CEE Subject / Unit Blueprint (200 Qs)</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Physics</span>
                  <span className="font-black text-slate-900 text-sm">50 Questions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Chemistry</span>
                  <span className="font-black text-slate-900 text-sm">50 Questions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Zoology</span>
                  <span className="font-black text-slate-900 text-sm">40 Questions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Botany</span>
                  <span className="font-black text-slate-900 text-sm">40 Questions</span>
                </div>
                <div className="p-3 bg-blue-50 col-span-2 rounded-xl border border-blue-200">
                  <span className="text-blue-600 text-[10px] uppercase block">MAT (Mental Ability Test)</span>
                  <span className="font-black text-blue-900 text-sm">20 Questions</span>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 sticky top-0 text-slate-500 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Subject → Unit</th>
                      <th className="px-3 py-2 text-right">Qs / Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {[
                      ['Zoology', 'Human Biology & Physiology', 15],
                      ['Zoology', 'Study of Selected Animals', 6],
                      ['Zoology', 'Animal Diversity & Classification', 4],
                      ['Zoology', 'Microbial Diseases & Immunology', 4],
                      ['Zoology', 'Animal Tissues & Histology', 4],
                      ['Zoology', 'Evolutionary Biology', 3],
                      ['Zoology', 'Medical Technology & Applied Biology', 2],
                      ['Zoology', 'Biota, Environment & Conservation', 2],
                      ['Botany', 'Biodiversity', 9],
                      ['Botany', 'Genetics', 6],
                      ['Botany', 'Plant Physiology', 6],
                      ['Botany', 'Cell Biology', 5],
                      ['Botany', 'Ecology & Vegetation', 4],
                      ['Botany', 'Plant Anatomy', 3],
                      ['Botany', 'Applied Botany', 3],
                      ['Botany', 'Developmental Botany', 2],
                      ['Botany', 'Basic Components of Life', 2],
                      ['Chemistry', 'Physical Chemistry', 17],
                      ['Chemistry', 'Organic Chemistry', 17],
                      ['Chemistry', 'Inorganic Chemistry', 10],
                      ['Chemistry', 'Applied Chemistry', 3],
                      ['Chemistry', 'Analytical Chemistry', 3],
                      ['Physics', 'Modern Physics', 12],
                      ['Physics', 'Mechanics', 10],
                      ['Physics', 'Current Electricity & Magnetism', 9],
                      ['Physics', 'Wave and Optics', 8],
                      ['Physics', 'Heat & Thermodynamics', 7],
                      ['Physics', 'Electrostatics & Capacitors', 4],
                      ['MAT', 'All Subsections', 20],
                    ].map(([subj, unit, n]) => (
                      <tr key={`${subj}-${unit}`}>
                        <td className="px-3 py-1.5">
                          {subj} → {unit}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold">{n as number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Direct platform contact desk</h3>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              Our support operators are online in Kathmandu for payment verifications, mock test errors, or login queries.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
              <a href="mailto:support@prepxnepal.edu.np" className="text-cyan-300 font-bold hover:underline flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>support@prepxnepal.edu.np</span>
              </a>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>+977 9801234567</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* 2. STUDENT USER JOURNEY */}
      {activeSubTab === 'workflow' && <WorkflowView />}

      {/* 3. LEGAL SLA */}
      {activeSubTab === 'policies' && <PoliciesView />}

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      {activeSubTab === 'faq' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span>Preparation & Billing FAQ Library</span>
          </h2>
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-4 space-y-2">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
                </button>
                {expandedFaq === idx && (
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pl-1">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TERMS OF SERVICE */}
      {activeSubTab === 'terms' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-xs text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Terms of Service Agreement</span>
          </h2>
          <p>
            Welcome to PrepX Nepal. By signing in via Clerk, starting mock tests, or purchasing credits, you agree to these Terms of Service.
          </p>
          <div className="space-y-3 pt-2 font-semibold">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">1. Non-Sharing of Credentials</span>
              <span>Each account subscription and mock credit quota is tied to a single user profile. Attempting to share your login credentials or bulk export question stems violates our academic fair-use terms.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">2. Timer Integrity & Attempt Lockouts</span>
              <span>All mock test attempts represent a synchronized mock exam window. Intentionally manipulating browser clocks or reloading pages repeatedly to extend duration constitutes test manipulation.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">3. Platform Services & Changes</span>
              <span>PrepX Nepal reserves the right to modify pricing tiers, update question keys based on medical curriculum feedback, and adjust coin rewards algorithms dynamically.</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRIVACY POLICY */}
      {activeSubTab === 'privacy' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-xs text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Privacy Policy & Data Security</span>
          </h2>
          <p>
            PrepX Nepal operates in compliance with the Privacy Act, 2075 of Nepal. We are committed to data minimization and protecting student credentials.
          </p>
          <div className="space-y-3 pt-2 font-semibold text-slate-600">
            <p>
              <strong>Data Collection:</strong> We collect only your name, email, target score, and answers selection data required to build reports. We do not inspect other local files or tracking cookies.
            </p>
            <p>
              <strong>Authentication Security:</strong> Clerk manages all sign-in procedures safely. We do not store your passwords on our local database logs.
            </p>
            <p>
              <strong>Transaction Safety:</strong> eSewa/Khalti verification records (Reference ID logs) are kept securely in our transaction claims table and audited purely to approve subscriptions.
            </p>
          </div>
        </div>
      )}

      {/* 7. STUDY COINS POLICY */}
      {activeSubTab === 'coins-policy' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-xs text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Study Coins Curation & Redemption Policy</span>
          </h2>
          <p>
            Study Coins represent a non-monetary, gamified preparation incentive loop designed to cultivate consistent study habits.
          </p>
          <div className="space-y-3 pt-2 font-semibold">
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
              <span className="text-amber-950 font-bold block mb-1">Earn Multipliers</span>
              <span>Students receive +10 coins upon CEE mock completions and +15 coins upon completing weak chapter revision packs. Repeated retakes of the same mock test do not award additional coins.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-900 font-bold block mb-1">Redemptions & Quotas</span>
              <span>Coins can be exchanged for Mock Credits or target formula packs. Coins carry zero cash valuation and cannot be transferred, sold, or redeemed for Nepalese Rupees.</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. REFUND POLICY */}
      {activeSubTab === 'refund' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto text-xs text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Refund & Claims Policy</span>
          </h2>
          <p>
            Please read our payment claim policies before scanning eSewa or Khalti QR codes.
          </p>
          <div className="space-y-3 pt-2 font-semibold">
            <p>
              <strong>Claim Audits:</strong> Verification claims are matched against the Reference ID ledger. Approved claims activate standard premium quotas (10 credits) or unlimited status immediately.
            </p>
            <p>
              <strong>Refund Eligibility:</strong> Because mock credentials can be consumed immediately, plan purchases are generally non-refundable once approved and credits are credited.
            </p>
            <p>
              <strong>Duplicate Payments:</strong> If you submit a duplicate verification claim or make a double payment, our moderators will verify the duplicate Reference IDs and refund or adjust credits within 3 business days.
            </p>
          </div>
        </div>
      )}

      {/* 9. REPORT AN ISSUE SUPPORT FORM */}
      {activeSubTab === 'issue' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-600" />
            <span>Report a Technical or Content Issue</span>
          </h2>

          {issueSubmitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Issue Submitted Successfully!</span>
                <span>Our moderation desk will review the content or transaction within 24 hours.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="space-y-1">
              <label className="block text-slate-700">Issue Category:</label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-350 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="technical">Vite App Bug / Timer Defect</option>
                <option value="content">Question Content / Explanation Error</option>
                <option value="payment">Payment Verification Claim Delay</option>
                <option value="coins">Study Coins Wallet Glitch</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-700">Description of Issue *:</label>
              <textarea
                required
                rows={4}
                value={issueDetails}
                onChange={(e) => setIssueDetails(e.target.value)}
                placeholder="Please describe what went wrong, including mock test title, question text, or payment reference ID..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Issue Report</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
