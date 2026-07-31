import React from 'react';
import { HelpCircle, ShieldCheck, AlertCircle, PhoneCall, Mail, ExternalLink, FileText } from 'lucide-react';

export const HelpSupportView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          <span>Help Center & Nepal CEE 2026 Regulations</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Everything you need to know about Medical Education Commission (MEC) Nepal CEE exam rules, negative marking, and platform support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CEE Marking Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>MEC CEE 2026 Exam Structure & Rules</span>
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-700">
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

        {/* Subject Weightage Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>CEE Subject Weightage (MBBS / BDS / B.Sc Nursing)</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
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
              <span className="text-blue-600 text-[10px] uppercase block">MAT (Aptitude & English)</span>
              <span className="font-black text-blue-900 text-sm">20 Questions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
        <h3 className="font-bold text-white text-base">Need Direct Help with PrepX Nepal?</h3>
        <p className="text-xs text-slate-300">
          Our team in Kathmandu is available to support you with eSewa payment verifications, mock test technical queries, or CEE preparation guidance.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
          <a href="mailto:support@prepxnepal.edu.np" className="text-cyan-300 font-bold hover:underline flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            <span>support@prepxnepal.edu.np</span>
          </a>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>+977 980-0000000</span>
          </span>
        </div>
      </div>
    </div>
  );
};
