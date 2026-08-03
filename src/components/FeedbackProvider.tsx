import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { AppIcon } from './ui';

type AlertVariant = 'info' | 'success' | 'error' | 'warning';

type AlertRequest = {
  title?: string;
  message: string;
  variant?: AlertVariant;
  confirmLabel?: string;
};

type ConfirmRequest = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PromptRequest = {
  title?: string;
  message?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'number';
  confirmLabel?: string;
  cancelLabel?: string;
  validate?: (value: string) => string | null;
};

type ToastRequest = {
  message: string;
  variant?: AlertVariant;
  durationMs?: number;
};

type FeedbackApi = {
  alert: (req: AlertRequest | string) => Promise<void>;
  confirm: (req: ConfirmRequest | string) => Promise<boolean>;
  prompt: (req: PromptRequest) => Promise<string | null>;
  toast: (req: ToastRequest | string) => void;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
}

type ModalKind =
  | { type: 'alert'; req: AlertRequest; resolve: () => void }
  | { type: 'confirm'; req: ConfirmRequest; resolve: (v: boolean) => void }
  | { type: 'prompt'; req: PromptRequest; resolve: (v: string | null) => void };

type ToastItem = {
  id: number;
  message: string;
  variant: AlertVariant;
};

const variantIcon = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
} as const;

const variantAccent: Record<AlertVariant, string> = {
  info: 'text-[#2563EB] bg-blue-50 border-blue-100',
  success: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  error: 'text-rose-700 bg-rose-50 border-rose-100',
  warning: 'text-amber-800 bg-amber-50 border-amber-100',
};

function normalizeAlert(req: AlertRequest | string): AlertRequest {
  return typeof req === 'string' ? { message: req } : req;
}

function normalizeConfirm(req: ConfirmRequest | string): ConfirmRequest {
  return typeof req === 'string' ? { message: req } : req;
}

function normalizeToast(req: ToastRequest | string): ToastRequest {
  return typeof req === 'string' ? { message: req, variant: 'success' } : req;
}

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [promptValue, setPromptValue] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descId = useId();
  const toastSeq = useRef(0);

  const closeModal = useCallback(() => setModal(null), []);

  const api = useMemo<FeedbackApi>(
    () => ({
      alert: (req) =>
        new Promise<void>((resolve) => {
          setModal({ type: 'alert', req: normalizeAlert(req), resolve });
        }),
      confirm: (req) =>
        new Promise<boolean>((resolve) => {
          setModal({ type: 'confirm', req: normalizeConfirm(req), resolve });
        }),
      prompt: (req) =>
        new Promise<string | null>((resolve) => {
          setPromptValue(req.defaultValue ?? '');
          setPromptError(null);
          setModal({ type: 'prompt', req, resolve });
        }),
      toast: (req) => {
        const n = normalizeToast(req);
        const id = ++toastSeq.current;
        setToasts((prev) => [...prev, { id, message: n.message, variant: n.variant ?? 'success' }]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, n.durationMs ?? 3200);
      },
    }),
    []
  );

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modal.type === 'alert') {
          modal.resolve();
          closeModal();
        } else if (modal.type === 'confirm') {
          modal.resolve(false);
          closeModal();
        } else {
          modal.resolve(null);
          closeModal();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [modal, closeModal]);

  useEffect(() => {
    if (modal?.type === 'prompt') {
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [modal]);

  const renderModal = () => {
    if (!modal) return null;

    if (modal.type === 'alert') {
      const variant = modal.req.variant ?? 'info';
      return (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Dismiss"
            onClick={() => {
              modal.resolve();
              closeModal();
            }}
          />
          <div className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-lg p-5 sm:p-6 space-y-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${variantAccent[variant]}`}>
              <AppIcon icon={variantIcon[variant]} size="card" />
            </div>
            <div className="space-y-1">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {modal.req.title ?? (variant === 'error' ? 'Something went wrong' : variant === 'success' ? 'Done' : 'Notice')}
              </h2>
              <p id={descId} className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {modal.req.message}
              </p>
            </div>
            <button
              type="button"
              className="w-full min-h-11 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl cursor-pointer"
              onClick={() => {
                modal.resolve();
                closeModal();
              }}
            >
              {modal.req.confirmLabel ?? 'OK'}
            </button>
          </div>
        </div>
      );
    }

    if (modal.type === 'confirm') {
      return (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Cancel"
            onClick={() => {
              modal.resolve(false);
              closeModal();
            }}
          />
          <div className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-lg p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {modal.req.title ?? 'Please confirm'}
              </h2>
              <p id={descId} className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {modal.req.message}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                className="min-h-11 px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-xl cursor-pointer hover:bg-slate-50"
                onClick={() => {
                  modal.resolve(false);
                  closeModal();
                }}
              >
                {modal.req.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                className={`min-h-11 px-4 py-2.5 text-white text-sm font-semibold rounded-xl cursor-pointer ${
                  modal.req.destructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                }`}
                onClick={() => {
                  modal.resolve(true);
                  closeModal();
                }}
              >
                {modal.req.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // prompt
    const submitPrompt = () => {
      const value = promptValue.trim();
      const err = modal.req.validate?.(value) ?? null;
      if (err) {
        setPromptError(err);
        return;
      }
      modal.resolve(value);
      closeModal();
    };

    return (
      <div
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-950/50"
          aria-label="Cancel"
          onClick={() => {
            modal.resolve(null);
            closeModal();
          }}
        />
        <form
          className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-lg p-5 sm:p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitPrompt();
          }}
        >
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {modal.req.title ?? 'Enter a value'}
            </h2>
            {modal.req.message && (
              <p id={descId} className="text-sm text-slate-600 leading-relaxed">
                {modal.req.message}
              </p>
            )}
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">{modal.req.label ?? 'Value'}</span>
            <input
              ref={inputRef}
              type={modal.req.inputType ?? 'text'}
              value={promptValue}
              placeholder={modal.req.placeholder}
              onChange={(e) => {
                setPromptValue(e.target.value);
                setPromptError(null);
              }}
              className="w-full min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
            {promptError && <span className="text-xs text-rose-600">{promptError}</span>}
          </label>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              className="min-h-11 px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-xl cursor-pointer hover:bg-slate-50"
              onClick={() => {
                modal.resolve(null);
                closeModal();
              }}
            >
              {modal.req.cancelLabel ?? 'Cancel'}
            </button>
            <button
              type="submit"
              className="min-h-11 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              {modal.req.confirmLabel ?? 'Save'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {renderModal()}

      <div
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[210] flex flex-col gap-2 sm:max-w-sm pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-lg ${variantAccent[t.variant]}`}
            >
              <AppIcon icon={variantIcon[t.variant]} size="btn" className="mt-0.5" />
              <p className="text-sm text-slate-800 flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer inline-flex items-center justify-center"
                aria-label="Dismiss"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              >
                <AppIcon icon={X} size="btn" />
              </button>
            </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};
