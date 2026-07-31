import React, { useState } from 'react';
import { CalendarCheck, CheckSquare, Square, Plus, Clock, Sparkles, BookOpen, Target, Award } from 'lucide-react';

export const StudyPlannerView: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 't1', subject: 'Biology', title: 'Genetics & Inheritance High-Yield Revision', duration: '35m', completed: true, highYield: true },
    { id: 't2', subject: 'Chemistry', title: 'Chemical Kinetics Formula & 20 MCQ Set', duration: '25m', completed: false, highYield: true },
    { id: 't3', subject: 'Physics', title: 'Rotational Dynamics Numerical Practice', duration: '30m', completed: false, highYield: false },
    { id: 't4', subject: 'Zoology', title: 'Nervous System & Brain Physiology Review', duration: '20m', completed: false, highYield: true },
    { id: 't5', subject: 'MAT', title: 'Verbal Reasoning & Pattern Recognition Drill', duration: '15m', completed: true, highYield: false },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Biology');

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      setTasks(prev => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          subject: newTaskSubject,
          title: newTaskTitle.trim(),
          duration: '20m',
          completed: false,
          highYield: false,
        }
      ]);
      setNewTaskTitle('');
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      {/* Title & Today's Goal */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-mono font-bold rounded-full">
            <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>CEE 2026 Daily Target</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Today’s Study Schedule</h1>
          <p className="text-xs text-slate-300">
            Complete high-yield chapter revisions daily to keep your 6-day streak active and earn +10 Study Coins.
          </p>
        </div>

        {/* Progress Circle Card */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4 shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-700" fill="transparent" />
              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-blue-400" fill="transparent" strokeDasharray={138} strokeDashoffset={138 - (138 * progressPercent) / 100} strokeLinecap="round" />
            </svg>
            <span className="absolute font-mono font-black text-xs text-white">{progressPercent}%</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white">{completedCount} of {tasks.length} Completed</div>
            <div className="text-[11px] text-slate-300 font-mono">+10 Study Coins Reward</div>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <select
          value={newTaskSubject}
          onChange={(e) => setNewTaskSubject(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
        >
          <option value="Biology">Biology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Physics">Physics</option>
          <option value="Zoology">Zoology</option>
          <option value="MAT">MAT / English</option>
        </select>

        <input
          type="text"
          placeholder="Add custom study target (e.g. Organic Reactions Practice)..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Target</span>
        </button>
      </form>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
              task.completed 
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-80' 
                : 'bg-white border-slate-200/80 hover:border-blue-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <button type="button" className="text-blue-600 shrink-0">
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                    task.completed ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {task.subject}
                  </span>
                  {task.highYield && (
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>High Yield</span>
                    </span>
                  )}
                </div>
                <h4 className={`text-xs sm:text-sm font-bold mt-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {task.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>{task.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
