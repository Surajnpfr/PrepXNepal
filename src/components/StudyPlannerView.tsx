import React, { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckSquare,
  Square,
  Plus,
  Clock,
  Sparkles,
  Target,
  Flame,
  Trash2,
} from 'lucide-react';
import type { StudyPlanTask, UserProfile } from '../types';
import { DAILY_REWARD_COINS, daysUntilExam } from '../lib/studyPlanner';

const SUBJECTS = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'MAT', 'CEE'] as const;

interface StudyPlannerViewProps {
  userProfile: UserProfile;
  tasks: StudyPlanTask[];
  streak: number;
  dateKey: string;
  rewardClaimedToday: boolean;
  onToggleTask: (id: string) => void;
  onAddTask: (subject: string, title: string) => void;
  onDeleteTask: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  userProfile,
  tasks,
  streak,
  dateKey,
  rewardClaimedToday,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onNavigate,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState<string>('Physics');

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const totalMins = tasks.reduce((s, t) => s + t.durationMin, 0);
  const examDays = daysUntilExam(userProfile.examDate || '2026-09-15');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskSubject, newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const sourceLabel = useMemo(() => {
    const auto = tasks.filter((t) => t.source === 'auto').length;
    const custom = tasks.filter((t) => t.source === 'custom').length;
    if (auto && custom) return `${auto} from mock analytics · ${custom} custom`;
    if (auto) return `${auto} tasks from your mock weakness analysis`;
    if (custom) return `${custom} custom targets`;
    return 'Add a target to start today’s plan';
  }, [tasks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-mono font-bold rounded-full">
            <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>CEE Daily Plan · {dateKey}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Today’s Study Schedule</h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {sourceLabel}. Target score {userProfile.targetScore}/200
            {examDays > 0 ? ` · ${examDays} days to exam` : ''}.
            Complete all tasks for +{DAILY_REWARD_COINS} Study Coins.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 border border-white/10">
              <Flame className="w-3 h-3 text-amber-400" />
              {streak}-day streak
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 border border-white/10">
              <Target className="w-3 h-3 text-emerald-400" />
              {totalMins} min planned
            </span>
            {rewardClaimedToday && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                +{DAILY_REWARD_COINS} coins claimed today
              </span>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4 shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90" aria-hidden>
              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-700" fill="transparent" />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className="text-blue-400"
                fill="transparent"
                strokeDasharray={138}
                strokeDashoffset={138 - (138 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-mono font-black text-xs text-white">{progressPercent}%</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {completedCount} of {tasks.length} Completed
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              {rewardClaimedToday ? 'Reward unlocked' : `+${DAILY_REWARD_COINS} coins when done`}
            </div>
          </div>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900">No tasks for today yet</p>
          <p className="text-xs text-slate-500">
            Complete a mock to auto-generate weak-chapter targets, or add a custom target below.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Browse Mock Catalog
          </button>
        </div>
      )}

      <form
        onSubmit={handleAddTask}
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3"
      >
        <select
          value={newTaskSubject}
          onChange={(e) => setNewTaskSubject(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Add custom study target (e.g. Organic Reactions Practice)..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Target</span>
        </button>
      </form>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
              task.completed
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-80'
                : 'bg-white border-slate-200/80 hover:border-blue-300 text-slate-900 shadow-2xs'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleTask(task.id)}
              className="flex items-center gap-3.5 text-left flex-1 min-w-0 cursor-pointer"
            >
              <span className="text-blue-600 shrink-0">
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                      task.completed ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {task.subject}
                  </span>
                  {task.highYield && (
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>High Yield</span>
                    </span>
                  )}
                  {task.source === 'auto' && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      From mocks
                    </span>
                  )}
                </div>
                <h4
                  className={`text-xs sm:text-sm font-bold mt-1 ${
                    task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </h4>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{task.durationMin}m</span>
              </div>
              {task.source === 'custom' && (
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Remove custom task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
