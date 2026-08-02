import React from 'react';
import { 
  UserPlus, 
  Settings2, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Award, 
  TrendingUp, 
  Coins, 
  LineChart, 
  Trophy, 
  CreditCard, 
  Sliders 
} from 'lucide-react';

interface WorkflowStep {
  number: number;
  title: string;
  icon: React.ComponentType<any>;
  features: string[];
  color: string;
  bgColor: string;
}

export const WorkflowView: React.FC = () => {
  const steps: WorkflowStep[] = [
    {
      number: 1,
      title: "Account Registration",
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-50/60 border-blue-100",
      features: [
        "Email Sign Up & Google Authentication",
        "Secure Password Encryption",
        "Profile Creation & Sign In Session Guard"
      ]
    },
    {
      number: 2,
      title: "Initial Setup",
      icon: Settings2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50/60 border-indigo-100",
      features: [
        "Select Target Examination (Nepal CEE)",
        "Set Personalized Target Score (e.g. 150+)",
        "Select Language Preference & Complete Profile",
        "Earn Profile Completion Study Coins"
      ]
    },
    {
      number: 3,
      title: "Student Dashboard",
      icon: LayoutDashboard,
      color: "text-violet-600",
      bgColor: "bg-violet-50/60 border-violet-100",
      features: [
        "Real-Time Exam Countdown",
        "Target Score Overview & Gap Analysis",
        "Predicted Score & Percentile Ranks",
        "Recent Mock History & Study Coins Wallet",
        "Weak Chapters Summary & Leaderboard Position"
      ]
    },
    {
      number: 4,
      title: "Mock Test Catalog",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50/60 border-purple-100",
      features: [
        "Previous Year Questions (PYQs)",
        "Free Demo Mock Tests",
        "Premium MEC CEE Mock Sets",
        "Purchase/Redeem additional Mock Quotas"
      ]
    },
    {
      number: 5,
      title: "Mock Test Experience",
      icon: FileText,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50/60 border-emerald-100",
      features: [
        "Actual MEC CEE Exam Formats",
        "Active Live Countdown Timer",
        "Negative Marking (-0.25 Penalty)",
        "20 Questions per page list navigation",
        "Single attempt lock with Auto-Save on timeout"
      ]
    },
    {
      number: 6,
      title: "Personalized Analysis",
      icon: Award,
      color: "text-amber-600",
      bgColor: "bg-amber-50/60 border-amber-100",
      features: [
        "Overall Score, Percentage & Accuracy details",
        "Predicted CEE Rank Band & Percentile estimation",
        "Subject-wise & Chapter-wise metrics",
        "Speed & Mistake category analysis",
        "Download & Share PDF reports"
      ]
    },
    {
      number: 7,
      title: "Personalized Improvement",
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-50/60 border-teal-100",
      features: [
        "Dynamic high-yield recommended chapters",
        "Direct Formula Sheet revision access",
        "Bookmark and review incorrect questions",
        "Targeted study planning for weak topics"
      ]
    },
    {
      number: 8,
      title: "Study Coins System",
      icon: Coins,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50/60 border-yellow-100",
      features: [
        "Earn Coins for exam submissions & milestones",
        "Reward ledger for weekly challenges & best scores",
        "Redeem coins for locked mock tests & premium guides",
        "Audit transaction histories in Coins Wallet"
      ]
    },
    {
      number: 9,
      title: "Performance Tracking",
      icon: LineChart,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50/60 border-cyan-100",
      features: [
        "Score timeline history graph",
        "Rank fluctuation tracking",
        "Daily/weekly study streaks tracking",
        "Personal best exam records showcase"
      ]
    },
    {
      number: 10,
      title: "Competitive Leaderboards",
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-50/60 border-orange-100",
      features: [
        "Overall national student leaderboard",
        "Weekly challenge rank comparison",
        "Detailed comparison to topper scores"
      ]
    },
    {
      number: 11,
      title: "Payments & Activation",
      icon: CreditCard,
      color: "text-rose-600",
      bgColor: "bg-rose-50/60 border-rose-100",
      features: [
        "Select Premium or Unlimited Access plans",
        "Submit manual payment claims via eSewa/Khalti",
        "Review status (Approved/Pending/Rejected) in history",
        "Direct receipt logging and instant activation"
      ]
    },
    {
      number: 12,
      title: "Account Settings",
      icon: Sliders,
      color: "text-slate-600",
      bgColor: "bg-slate-50/60 border-slate-100",
      features: [
        "Edit avatar, target exam & study details",
        "Secure Password Resets",
        "Dark Mode / Light Mode styling themes",
        "Secure Session Logouts"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/40 border border-blue-100/80 p-5 rounded-2xl">
        <h2 className="text-sm font-bold text-blue-900 mb-1">Student Prep Journey Roadmap</h2>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Follow the standardized, data-driven workflow of PrepX Nepal to continuously analyze, target, and improve your MEC Common Entrance Examination (CEE) scores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div 
              key={step.number} 
              className={`p-5 rounded-2xl border ${step.bgColor} hover:shadow-xs transition-all flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-white ${step.color} shadow-2xs`}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-black text-slate-400">Step {step.number}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-sm">{step.title}</h3>
                  <ul className="space-y-1 text-slate-600 text-[11px] font-semibold list-none">
                    {step.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-normal">
                        <span className="text-slate-400 mt-1 shrink-0">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
