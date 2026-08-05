export type SiteNotice = {
  id: string;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaHrefTab?: string;
  active: boolean;
  priority: number;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
};

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string }).error || `Request failed (${res.status})`;
}

/** Public — no auth. Returns the highest-priority currently active notice, or null. */
export async function fetchActiveNotice(): Promise<SiteNotice | null> {
  const res = await fetch('/api/notices/active');
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data.notice as SiteNotice | null) ?? null;
}

export async function fetchNotices(
  getToken: () => Promise<string | null>
): Promise<SiteNotice[]> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/notices', { headers });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data.notices || []) as SiteNotice[];
}

export async function createNotice(
  getToken: () => Promise<string | null>,
  input: {
    title: string;
    body?: string | null;
    ctaLabel?: string | null;
    ctaHrefTab?: string | null;
    active?: boolean;
    priority?: number;
    startsAt?: string | null;
    expiresAt?: string | null;
  }
): Promise<SiteNotice> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/notices', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.notice as SiteNotice;
}

export async function updateNotice(
  getToken: () => Promise<string | null>,
  id: string,
  patch: Partial<{
    title: string;
    body: string | null;
    ctaLabel: string | null;
    ctaHrefTab: string | null;
    active: boolean;
    priority: number;
    startsAt: string | null;
    expiresAt: string | null;
  }>
): Promise<SiteNotice> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.notice as SiteNotice;
}

export async function deleteNotice(
  getToken: () => Promise<string | null>,
  id: string
): Promise<void> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(await readError(res));
}
