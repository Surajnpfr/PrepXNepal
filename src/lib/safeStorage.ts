/** Reusable localStorage helpers that never crash the app on quota / serialize errors. */

export type SafeStorageWriteResult =
  | { ok: true; bytes: number }
  | {
      ok: false;
      reason: 'quota' | 'serialize' | 'unavailable' | 'oversized' | 'unchanged_failure';
      bytes: number;
      error?: unknown;
    };

const failedWriteSignatures = new Map<string, string>();

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { name?: string; code?: number | string; message?: string };
  if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true;
  if (e.code === 22 || e.code === 1014) return true;
  const msg = String(e.message || '');
  return /quota|exceeded the quota/i.test(msg);
}

export function estimateJsonBytes(value: unknown): number {
  try {
    const json = typeof value === 'string' ? value : JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(json).length;
    }
    return unescape(encodeURIComponent(json)).length;
  } catch {
    return 0;
  }
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(3)} MB`;
}

function logDev(message: string, detail?: Record<string, unknown>): void {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    if (detail) {
      console.warn(message, detail);
    } else {
      console.warn(message);
    }
  } else if (detail) {
    console.warn(message, detail);
  } else {
    console.warn(message);
  }
}

export function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    logDev('[PrepX Storage] Failed to read/parse key', { key, error });
    return fallback;
  }
}

export function safeStorageGetRaw(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Serialize and write. On quota failure the previous value for `key` is left intact.
 * Identical payloads that already failed once are not retried until the value changes.
 */
export function safeStorageSet(key: string, value: unknown): SafeStorageWriteResult {
  let json: string;
  try {
    json = typeof value === 'string' ? value : JSON.stringify(value);
  } catch (error) {
    logDev('[PrepX Storage] Serialize failed', { key, error });
    return { ok: false, reason: 'serialize', bytes: 0, error };
  }

  const bytes = estimateJsonBytes(json);
  const signature = `${bytes}:${json.length}:${json.slice(0, 64)}:${json.slice(-64)}`;
  if (failedWriteSignatures.get(key) === signature) {
    return { ok: false, reason: 'unchanged_failure', bytes };
  }

  try {
    if (typeof localStorage === 'undefined') {
      return { ok: false, reason: 'unavailable', bytes };
    }
    localStorage.setItem(key, json);
    failedWriteSignatures.delete(key);
    return { ok: true, bytes };
  } catch (error) {
    failedWriteSignatures.set(key, signature);
    if (isQuotaError(error)) {
      logDev('[PrepX Storage] Quota exceeded', {
        key,
        attemptedSize: formatMb(bytes),
        attemptedBytes: bytes,
      });
      return { ok: false, reason: 'quota', bytes, error };
    }
    logDev('[PrepX Storage] Write failed', { key, attemptedBytes: bytes, error });
    return { ok: false, reason: 'unavailable', bytes, error };
  }
}

export function safeStorageRemove(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
    failedWriteSignatures.delete(key);
  } catch (error) {
    logDev('[PrepX Storage] Remove failed', { key, error });
  }
}

export function clearFailedWriteGuard(key?: string): void {
  if (key) failedWriteSignatures.delete(key);
  else failedWriteSignatures.clear();
}
