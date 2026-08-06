import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import type { Question, UserProfile } from '../types';
import {
  approveDailyQuick,
  createDailyQuick,
  deleteDailyQuick,
  fetchDailyQuickQueue,
  updateDailyQuick,
  type DailyQuickPayload,
  type DailyQuickSubject,
} from '../lib/dailyQuickApi';
import { canApproveDailyQuickRole } from '../lib/userRoles';
import { BOOTSTRAP_ADMIN_EMAIL } from '../lib/clerkUserMapper';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';
import { MathText } from './MathText';
const SUBJECTS: DailyQuickSubject[] = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

const fieldClass =
  'w-full min-h-11 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

const emptyForm = (): DailyQuickPayload => ({
  subject: 'Physics',
  question: '',
  options: { A: '', B: '', C: '', D: '' },
  correctAnswer: 'A',
  explanation: '',
});

type Props = {
  userProfile: UserProfile;
};

/**
 * QAD / Admin Daily Quick upload + queue.
 * Content Manager owns bank/mocks; Billing owns payments; QAD owns Daily Quick.
 */
export const AdminDailyQuickPanel: React.FC<Props> = ({ userProfile }) => {
  const { getToken } = useAuth();
  const feedback = useFeedback();
  const canApprove = canApproveDailyQuickRole(
    userProfile.role,
    userProfile.email === BOOTSTRAP_ADMIN_EMAIL
  );

  const [queue, setQueue] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DailyQuickPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyQuickQueue(getToken);
      setQueue(data.questions);
    } catch (err: any) {
      setError(err?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingCount = useMemo(
    () => queue.filter((q) => q.status === 'pending_review').length,
    [queue]
  );

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setShowForm(true);
    setForm({
      subject: q.subject as DailyQuickSubject,
      question: q.stem,
      options: { ...q.options },
      correctAnswer: (q.correctOptionKey || 'A') as DailyQuickPayload['correctAnswer'],
      explanation: q.explanation || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateDailyQuick(getToken, editingId, form);
        feedback.toast({ variant: 'success', message: 'Daily Quick updated' });
      } else {
        await createDailyQuick(getToken, form);
        feedback.toast({ variant: 'success', message: 'Submitted for Admin approval' });
      }
      resetForm();
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Save failed',
        message: err?.message || 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveDailyQuick(getToken, id);
      feedback.toast({ variant: 'success', message: 'Published to landing + home' });
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Approve failed',
        message: err?.message || 'Approve failed',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await feedback.confirm({
      title: 'Delete Daily Quick?',
      message: 'This removes the question from the bank as well.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteDailyQuick(getToken, id);
      feedback.toast({ variant: 'success', message: 'Deleted' });
      if (editingId === id) resetForm();
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Delete failed',
        message: err?.message || 'Delete failed',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto md:max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">
            Daily Quick · QAD
          </p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Upload practice questions
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            One live question per subject (Physics, Chemistry, Botany, Zoology). New items stay
            pending until an Admin publishes them. They also enter the question bank.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="shrink-0 min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Refresh queue"
        >
          <AppIcon icon={RefreshCw} size="btn" className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full min-h-12 rounded-xl bg-slate-900 text-white text-sm font-bold inline-flex items-center justify-center gap-2"
        >
          <AppIcon icon={Plus} size="btn" />
          New question
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {editingId ? 'Edit question' : 'New question'}
            </h3>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1"
              >
                <AppIcon icon={X} size="btn" />
                Cancel edit
              </button>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Subject
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map((subject) => {
                const active = form.subject === subject;
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, subject }))}
                    className={`min-h-12 rounded-xl border text-sm font-bold transition-colors ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Question
            </span>
            <textarea
              required
              rows={4}
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              className={`${fieldClass} resize-y`}
              placeholder="Write the stem clearly…"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Options
            </legend>
            <div className="space-y-2">
              {OPTION_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-xs font-black flex items-center justify-center shrink-0">
                    {key}
                  </span>
                  <input
                    required
                    value={form.options[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        options: { ...f.options, [key]: e.target.value },
                      }))
                    }
                    className={fieldClass}
                    placeholder={`Option ${key}`}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Correct answer
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {OPTION_KEYS.map((key) => {
                const active = form.correctAnswer === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, correctAnswer: key }))}
                    className={`min-h-12 rounded-xl border text-sm font-black ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Explanation
            </span>
            <textarea
              required
              rows={3}
              value={form.explanation}
              onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
              className={`${fieldClass} resize-y`}
              placeholder="Why this answer is correct…"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-12 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <AppIcon icon={Loader2} size="btn" className="animate-spin" />
            ) : (
              <AppIcon icon={Plus} size="btn" />
            )}
            {editingId ? 'Save changes' : 'Submit for approval'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Queue</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {pendingCount} pending
          </span>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {loading && queue.length === 0 ? (
          <p className="text-sm text-slate-500 inline-flex items-center gap-2">
            <AppIcon icon={Loader2} size="btn" className="animate-spin" />
            Loading…
          </p>
        ) : null}

        {queue.length === 0 && !loading ? (
          <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 p-6 text-center">
            No Daily Quick questions yet. Add the first one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {queue.map((q) => (
              <li
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {q.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {q.status === 'published' ? 'Live' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 line-clamp-3">
                      <MathText text={q.stem} />
                    </p>
                    <p className="text-xs text-slate-500">
                      Correct: {q.correctOptionKey} · {q.options[q.correctOptionKey || 'A']}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canApprove && q.status === 'pending_review' ? (
                    <button
                      type="button"
                      onClick={() => void handleApprove(q.id)}
                      className="min-h-10 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <AppIcon icon={CheckCircle2} size="btn" />
                      Approve
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => startEdit(q)}
                    className="min-h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <AppIcon icon={Pencil} size="btn" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(q.id)}
                    className="min-h-10 px-3 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <AppIcon icon={Trash2} size="btn" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
