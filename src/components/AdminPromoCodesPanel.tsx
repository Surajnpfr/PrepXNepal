import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Tag, Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
  createPromoCode,
  deletePromoCode,
  fetchPromoCodes,
  updatePromoCode,
  type PromoCode,
} from '../lib/promoCodesApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '10',
  applicablePlanCodes: '',
  maxRedemptions: '',
  startsAt: '',
  expiresAt: '',
};

export const AdminPromoCodesPanel: React.FC = () => {
  const { getToken } = useAuth();
  const feedback = useFeedback();
  const [rows, setRows] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPromoCodes(getToken);
      setRows(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const discountValue = Number(form.discountValue);
      const maxRaw = form.maxRedemptions.trim();
      await createPromoCode(getToken, {
        code: form.code,
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue,
        applicablePlanCodes: form.applicablePlanCodes
          .split(/[,|\s]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        maxRedemptions: maxRaw ? Number(maxRaw) : null,
        startsAt: form.startsAt.trim() || null,
        expiresAt: form.expiresAt.trim() || null,
        active: true,
      });
      setForm(emptyForm);
      feedback.toast({ variant: 'success', message: 'Promo code created.' });
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Could not create promo',
        message: err?.message || 'Create failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      await updatePromoCode(getToken, promo.id, { active: !promo.active });
      feedback.toast({
        variant: 'success',
        message: promo.active ? 'Promo deactivated.' : 'Promo activated.',
      });
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Update failed',
        message: err?.message || 'Could not update promo',
      });
    }
  };

  const handleDelete = async (promo: PromoCode) => {
    const ok = await feedback.confirm({
      title: `Delete ${promo.code}?`,
      message: 'Students will no longer be able to use this code. Existing claims keep their recorded discount.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await deletePromoCode(getToken, promo.id);
      feedback.toast({ variant: 'success', message: 'Promo deleted.' });
      await refresh();
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Delete failed',
        message: err?.message || 'Could not delete promo',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <AppIcon icon={Tag} size="card" className="text-emerald-600" />
            Promo codes
          </h3>
          <p className="text-sm text-slate-600 max-w-2xl">
            Admin-only offers students can apply when purchasing a plan. Discount is validated on the
            server and stored on the payment claim.
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
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Code
          <input
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="CEE20"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-mono"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Type
          <select
            value={form.discountType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                discountType: e.target.value as 'percent' | 'fixed',
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed NPR off</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Value {form.discountType === 'percent' ? '(%)' : '(NPR)'}
          <input
            required
            type="number"
            min={1}
            max={form.discountType === 'percent' ? 100 : undefined}
            step={1}
            value={form.discountValue}
            onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-mono"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
          Description
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Launch offer for Premium"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Plans (blank = all)
          <input
            value={form.applicablePlanCodes}
            onChange={(e) => setForm((f) => ({ ...f, applicablePlanCodes: e.target.value }))}
            placeholder="Premium, Unlimited"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Max redemptions
          <input
            type="number"
            min={1}
            value={form.maxRedemptions}
            onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
            placeholder="Unlimited"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-mono"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Starts at
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Expires at
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <AppIcon icon={Plus} size="btn" />
            {saving ? 'Saving…' : 'Create promo'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">Loading promo codes…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No promo codes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                <th className="p-3">Code</th>
                <th className="p-3">Offer</th>
                <th className="p-3">Plans</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((promo) => (
                <tr key={promo.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-mono font-bold text-slate-900">{promo.code}</div>
                    {promo.description ? (
                      <div className="text-[10px] text-slate-500 mt-0.5">{promo.description}</div>
                    ) : null}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">
                    {promo.discountType === 'percent'
                      ? `${promo.discountValue}% off`
                      : `NPR ${promo.discountValue} off`}
                  </td>
                  <td className="p-3 text-slate-600">
                    {promo.applicablePlanCodes.length
                      ? promo.applicablePlanCodes.join(', ')
                      : 'All plans'}
                  </td>
                  <td className="p-3 font-mono text-slate-700">
                    {promo.redemptionCount}
                    {promo.maxRedemptions != null ? ` / ${promo.maxRedemptions}` : ' / ∞'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        promo.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {promo.active ? 'ACTIVE' : 'OFF'}
                    </span>
                    {promo.expiresAt ? (
                      <div className="text-[10px] text-slate-500 mt-1">
                        Exp {new Date(promo.expiresAt).toLocaleDateString()}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => void toggleActive(promo)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-white"
                    >
                      {promo.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(promo)}
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
