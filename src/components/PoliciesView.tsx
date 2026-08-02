import React from 'react';
import { ShieldCheck, FileText, Lock, AlertTriangle, CheckCircle2, Clock, Mail } from 'lucide-react';

export const PoliciesView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-[#17324D] text-white p-6 rounded-xl border border-slate-800 shadow-md space-y-2">
        <div className="flex items-center space-x-2 text-amber-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Institutional Policy & Legal Governance Framework</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Exam Rules, Copyright & Takedown SLA
        </h1>
        <p className="text-xs text-slate-300 max-w-2xl">
          PrepX Nepal operates as a competitive examination preparation platform, delivering mock tests, practice questions, and high-yield revision tools for Nepal CEE aspirants, strictly enforcing copyright protections and MEC regulations.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        
        {/* Section 1: Content Provenance */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8A1538]" />
            1. Content Copyright & Provenance (Nepal Copyright Act 2059)
          </h2>
          <p>
            Under the Nepal Copyright Act, 2059 (2002), authors and content creators retain statutory rights over original copyrightable works. PrepX Nepal ensures all mock exam papers, previous year papers (PYPs), and chapter questions are authored or legally licensed for educational practice. Any user or publisher who believes their copyright is violated may submit a formal takedown request under our SLA.
          </p>
          <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
            <li><strong>MEC Syllabus (Default):</strong> Timed mock tests covering Physics, Chemistry, Botany, Zoology, and MAT.</li>
            <li><strong>PYP Archive:</strong> Genuine historical papers for student revision under fair-use educational practice.</li>
            <li><strong>PrepX Proprietary:</strong> Custom practice questions and explanation sets verified by moderators.</li>
          </ul>
        </section>

        {/* Section 2: Takedown SLA */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            2. Copyright Takedown SLA & Dispute Resolution
          </h2>
          <p>
            PrepX Nepal enforces strict response SLAs for copyright infringement notices, payment verification disputes, or incorrect questions reported by users:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-950 block mb-0.5">Acknowledgment SLA:</span>
              <span>All formal takedown reports or payment claims resolved or acknowledged within <strong>1 business day</strong>.</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-950 block mb-0.5">Resolution SLA:</span>
              <span>Content review, temporary question quarantine, or removal finalized within <strong>3 business days</strong>.</span>
            </div>
          </div>
        </section>

        {/* Section 3: Privacy Notice */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#17324D]" />
            3. Privacy & Data Minimization (Nepal Privacy Act 2075)
          </h2>
          <p>
            In compliance with Nepal’s Privacy Act, 2075 (2018), PrepX Nepal practices data minimization. The platform collects only essential user profile details (target score, exam date, preferred language) and session identifiers required for Clerk authentication and mock attempt history. Personal student data, transaction records, and study results are kept secure and never sold or shared.
          </p>
        </section>

        {/* Contact Governance Office */}
        <div className="pt-4 border-t border-slate-200 bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-white text-xs">PrepX Nepal Academic Operations Team</h4>
            <p className="text-[11px] text-slate-300">Kathmandu, Nepal</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold bg-[#2563EB] px-3 py-1.5 rounded-lg">
            <Mail className="w-3.5 h-3.5" />
            <span>support@prepxnepal.edu.np</span>
          </div>
        </div>
      </div>
    </div>
  );
};
