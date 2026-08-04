import React, { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckSquare,
  Square,
  Plus,
  Clock,
  Target,
  Flame,
  Trash2,
} from 'lucide-react';
import type { StudyPlanTask, UserProfile } from '../types';
import { DAILY_REWARD_COINS, daysUntilExam } from '../lib/studyPlanner';
import { TENTATIVE_EXAM_LABEL, isExamDateSet } from '../lib/examSchedule';
import { AppIcon } from './ui';
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
  const examDateSet = isExamDateSet(userProfile.examDate);
  const examDays = examDateSet ? daysUntilExam(userProfile.examDate) : 0;

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
      <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 inline-flex items-center gap-1.5">
            <AppIcon icon={CalendarCheck} size="btn" />
            Today · {dateKey}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Study plan</h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            {sourceLabel}. Target {userProfile.targetScore}/200
            {examDateSet && examDays > 0
              ? ` · ${examDays} days to exam`
              : ` · ${TENTATIVE_EXAM_LABEL}`}
            . Finish all tasks for +{DAILY_REWARD_COINS} coins.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="inline-flex items-center gap-1 font-medium px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
              <AppIcon icon={Flame} size="btn" className="text-amber-400" />
              {streak}-day streak
            </span>
            <span className="inline-flex items-center gap-1 font-medium px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
              <AppIcon icon={Target} size="btn" className="text-emerald-400" />
              {totalMins} min planned
            </span>
            {rewardClaimedToday && (
              <span className="font-medium px-2 py-1 rounded-md bg-emerald-900/40 text-emerald-300 border border-emerald-800">
                +{DAILY_REWARD_COINS} coins claimed
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 shrink-0">
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
          <p className="text-sm font-bold text-slate-900">No study tasks for today</p>
          <p className="text-xs text-slate-500">
            Complete a mock to get suggested chapter targets, or add your own below.
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
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <select
          value={newTaskSubject}
          onChange={(e) => setNewTaskSubject(e.target.value)}
          className="w-full sm:w-auto min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
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
          className="flex-1 w-full min-h-11 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
        />

        <button
          type="submit"
          className="min-h-11 w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <AppIcon icon={Plus} size="btn" />
          <span>Add Target</span>
        </button>
      </form>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
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
                  <AppIcon icon={CheckSquare} size="card" className="text-emerald-600" />
                ) : (
                  <AppIcon icon={Square} size="card" className="text-slate-400" />
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
                      <AppIcon icon={Flame} size="btn" className="text-amber-600" />
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
                <AppIcon icon={Clock} size="btn" />
                <span>{task.durationMin}m</span>
              </div>
              {task.source === 'custom' && (
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Remove custom task"
                >
                  <AppIcon icon={Trash2} size="btn" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
