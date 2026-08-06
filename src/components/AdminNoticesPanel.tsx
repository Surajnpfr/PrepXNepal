import React, { useCallback, useEffect, useState } from 'react';
import { Megaphone, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
  createNotice,
  deleteNotice,
  fetchNotices,
  updateNotice,
  type SiteNotice,
} from '../lib/noticesApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon, Select } from './ui';

const CTA_TAB_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'catalog', label: 'Mock Tests (catalog)' },
  { value: 'payment', label: 'Payment' },
  { value: 'formulas', label: 'Formulas' },
  { value: 'reports', label: 'Reports' },
  { value: 'policies', label: 'Policies / Help' },
] as const;

const emptyForm = {
  title: '',
  body: '',
  ctaLabel: '',
  ctaHrefTab: '',
  priority: '0',
  startsAt: '',
  expiresAt: '',
  active: true,
};

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local is wall-clock local time — persist as ISO so 10 PM means 10 PM for the admin. */
function fromDatetimeLocal(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function noticeToForm(notice: SiteNotice) {
  return {
    title: notice.title,
    body: notice.body || '',
    ctaLabel: notice.ctaLabel || '',
    ctaHrefTab: notice.ctaHrefTab || '',
    priority: String(notice.priority ?? 0),
    startsAt: toDatetimeLocal(notice.startsAt),
    expiresAt: toDatetimeLocal(notice.expiresAt),
    active: notice.active,
  };
}

export const AdminNoticesPanel: React.FC = () => {
  const { getToken } = useAuth();
  const feedback = useFeedback();
  const [rows, setRows] = useState<SiteNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchNotices(getToken);
      setRows(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clearEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (notice: SiteNotice) => {
    setEditingId(notice.id);
    setForm(noticeToForm(notice));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        body: form.body.trim() || null,
        ctaLabel: form.ctaLabel.trim() || null,
        ctaHrefTab: form.ctaHrefTab.trim() || null,
        priority: Number(form.priority) || 0,
        startsAt: fromDatetimeLocal(form.startsAt),
        expiresAt: fromDatetimeLocal(form.expiresAt),
        active: form.active,
      };
      if (editingId) {
        await updateNotice(getToken, editingId, payload);
        feedback.toast({ variant: 'success', message: 'Notice updated.' });
      } else {
        await createNotice(getToken, payload);
        feedback.toast({ variant: 'success', message: 'Notice created.' });
      }
      clearEdit();
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: editingId ? 'Could not update notice' : 'Could not create notice',
        message: err?.message || 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (notice: SiteNotice) => {
    try {
      await updateNotice(getToken, notice.id, { active: !notice.active });
      feedback.toast({
        variant: 'success',
        message: notice.active ? 'Notice deactivated.' : 'Notice activated.',
      });
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Update failed',
        message: err?.message || 'Could not update notice',
      });
    }
  };

  const handleDelete = async (notice: SiteNotice) => {
    const ok = await feedback.confirm({
      title: `Delete “${notice.title}”?`,
      message: 'This notice will no longer appear in the announcement bar.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteNotice(getToken, notice.id);
      if (editingId === notice.id) clearEdit();
      feedback.toast({ variant: 'success', message: 'Notice deleted.' });
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Delete failed',
        message: err?.message || 'Could not delete notice',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <AppIcon icon={Megaphone} size="card" className="text-sky-600" />
            Site notices
          </h3>
          <p className="text-sm text-slate-600 max-w-2xl">
            Admin announcements shown in the top bar. Highest priority active notice wins; schedule
            with start/expiry windows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <AppIcon icon={RefreshCw} size="btn" />
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {editingId ? (
          <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
            <span>Editing notice</span>
            <button
              type="button"
              onClick={clearEdit}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <AppIcon icon={X} size="btn" />
              Cancel
            </button>
          </div>
        ) : null}

        <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
          Title *
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Premium plan sale this week"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Priority
          <input
            type="number"
            step={1}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-mono"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2 lg:col-span-3">
          Body
          <input
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Optional supporting sentence"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          CTA label
          <input
            value={form.ctaLabel}
            onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
            placeholder="View offer"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          CTA tab
          <Select
            value={form.ctaHrefTab}
            onChange={(e) => setForm((f) => ({ ...f, ctaHrefTab: e.target.value }))}
          >
            {CTA_TAB_OPTIONS.map((opt) => (
              <option key={opt.value || 'none'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700 flex flex-col justify-end">
          <span className="inline-flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="rounded border-slate-300"
            />
            Active
          </span>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Starts at
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
          <span className="font-normal text-slate-400">Your local time (e.g. 10:00 PM NPT)</span>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Expires at
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
          <span className="font-normal text-slate-400">Your local time</span>
        </label>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={clearEdit}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-white"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <AppIcon icon={editingId ? Pencil : Plus} size="btn" />
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create notice'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">Loading notices…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No notices yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                <th className="p-3">Title</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Schedule</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((notice) => (
                <tr key={notice.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{notice.title}</div>
                    {notice.body ? (
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        {notice.body}
                      </div>
                    ) : null}
                    {notice.ctaLabel ? (
                      <div className="text-[10px] text-sky-700 mt-0.5">
                        CTA: {notice.ctaLabel}
                        {notice.ctaHrefTab ? ` → ${notice.ctaHrefTab}` : ''}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        notice.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {notice.active ? 'ACTIVE' : 'OFF'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700">{notice.priority}</td>
                  <td className="p-3 text-slate-600">
                    {notice.startsAt ? (
                      <div>From {new Date(notice.startsAt).toLocaleString()}</div>
                    ) : (
                      <div className="text-slate-400">No start</div>
                    )}
                    {notice.expiresAt ? (
                      <div>Until {new Date(notice.expiresAt).toLocaleString()}</div>
                    ) : (
                      <div className="text-slate-400">No expiry</div>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => void toggleActive(notice)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-white"
                    >
                      {notice.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(notice)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-white inline-flex items-center gap-1"
                    >
                      <AppIcon icon={Pencil} size="btn" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(notice)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                    >
                      <AppIcon icon={Trash2} size="btn" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
