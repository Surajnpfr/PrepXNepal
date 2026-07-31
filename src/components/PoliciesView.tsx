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
          Rights, Copyright & Takedown SLA
        </h1>
        <p className="text-xs text-slate-300 max-w-2xl">
          IOE Notes operates as an approved academic learning repository under Tribhuvan University governance, strictly enforcing rights metadata and copyright protections.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        
        {/* Section 1: Copyright Policy */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8A1538]" />
            1. Faculty Copyright & Provenance (Nepal Copyright Act 2059)
          </h2>
          <p>
            Under the Nepal Copyright Act, 2059 (2002), authors retain statutory rights over original copyrightable works. IOE Notes requires every uploaded lecture handout, lab manual, and problem set to carry explicit rights declarations prior to public release.
          </p>
          <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
            <li><strong>CC BY-NC 4.0 (Default):</strong> Allows students and researchers to adapt and build upon notes for non-commercial educational purposes with proper attribution.</li>
            <li><strong>CC BY-NC-ND 4.0:</strong> Allows redistribution for non-commercial use without modifications.</li>
            <li><strong>IOE Internal:</strong> Restricted to registered Institute of Engineering students and faculty.</li>
          </ul>
        </section>

        {/* Section 2: Takedown SLA */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            2. Copyright Takedown SLA & Dispute Resolution
          </h2>
          <p>
            IOE Notes enforces strict response SLAs for copyright infringement notices, broken asset reports, or rights disputes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-900 block mb-0.5">Acknowledgment SLA:</span>
              <span>All formal takedown reports acknowledged within <strong>1 business day</strong>.</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-900 block mb-0.5">Resolution SLA:</span>
              <span>Content review, temporary quarantine, or removal finalized within <strong>5 business days</strong>.</span>
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
            In compliance with Nepal’s Privacy Act, 2075 (2018), IOE Notes practices data minimization. The repository collects only essential operational logs and faculty email identifiers required for authentication and version audit trails. Personal student records are never sold, monetized, or shared with commercial study brokers.
          </p>
        </section>

        {/* Contact Governance Office */}
        <div className="pt-4 border-t border-slate-200 bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-white text-xs">IOE Academic Governance Office</h4>
            <p className="text-[11px] text-slate-300">Central Dean Office, Pulchowk Campus, Lalitpur, Nepal</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold bg-[#8A1538] px-3 py-1.5 rounded-lg">
            <Mail className="w-3.5 h-3.5" />
            <span>notes-governance@ioe.edu.np</span>
          </div>
        </div>
      </div>
    </div>
  );
};
