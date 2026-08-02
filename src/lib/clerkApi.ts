import type { UserProfile } from '../types';

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchClerkUsers(
  getToken: () => Promise<string | null>
): Promise<{ users: UserProfile[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/users', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch users (${res.status})`);
  }
  return res.json();
}

export async function fetchClerkMe(
  getToken: () => Promise<string | null>
): Promise<{ user: UserProfile; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/users/me', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch profile (${res.status})`);
  }
  return res.json();
}

export async function patchClerkUser(
  getToken: () => Promise<string | null>,
  clerkId: string,
  patch: Partial<UserProfile>
): Promise<UserProfile> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/users/${encodeURIComponent(clerkId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to update user (${res.status})`);
  }
  const data = await res.json();
  return data.user as UserProfile;
}
