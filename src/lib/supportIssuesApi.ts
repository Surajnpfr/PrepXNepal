export type SupportIssueCategory = 'technical' | 'content' | 'payment' | 'coins';
export type SupportIssueStatus = 'open' | 'resolved';

export type SupportIssue = {
  id: string;
  clerkUserId: string;
  userName: string;
  userEmail: string;
  category: SupportIssueCategory;
  body: string;
  status: SupportIssueStatus;
  staffNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Sign in required to submit or view issue reports');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string }).error || `Request failed (${res.status})`;
}

export async function submitSupportIssue(
  getToken: () => Promise<string | null>,
  input: { category: SupportIssueCategory; body: string }
): Promise<SupportIssue> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/support-issues', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.issue as SupportIssue;
}

export async function fetchSupportIssues(
  getToken: () => Promise<string | null>
): Promise<{ issues: SupportIssue[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/support-issues', { headers });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function resolveSupportIssue(
  getToken: () => Promise<string | null>,
  issueId: string,
  staffNotes?: string
): Promise<SupportIssue> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/support-issues/${encodeURIComponent(issueId)}/resolve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ staffNotes: staffNotes || '' }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.issue as SupportIssue;
}
