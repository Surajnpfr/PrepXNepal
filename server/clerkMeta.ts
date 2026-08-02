/**
 * Optimistic concurrency helper for Clerk publicMetadata mutations.
 * Stores integer `_v` and retries when a concurrent writer wins.
 * Per-userId in-process lock serializes sensitive entitlement writes on one API instance.
 */

export type PublicMeta = Record<string, unknown>;

export type ClerkUserLike = {
  id: string;
  publicMetadata: PublicMeta | null | undefined;
};

export type MetaMutatorResult =
  | { ok: true; next: PublicMeta }
  | { ok: false; error: string; status: number };

const META_VERSION_KEY = '_v';
const userLocks = new Map<string, Promise<unknown>>();

export function readMetaVersion(meta: PublicMeta): number {
  return typeof meta[META_VERSION_KEY] === 'number' ? (meta[META_VERSION_KEY] as number) : 0;
}

/**
 * Serialize async work per userId (single-process). Prevents TOCTOU on quota/coins
 * when parallel requests hit the same API instance.
 */
export async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = userLocks.get(userId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(
    () => gate,
    () => gate
  );
  userLocks.set(userId, chained);
  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
    if (userLocks.get(userId) === chained) {
      userLocks.delete(userId);
    }
  }
}

/** Pure apply step used by tests and the live updater. */
export function applyMetaMutation(
  current: PublicMeta,
  mutator: (draft: PublicMeta) => MetaMutatorResult
): MetaMutatorResult {
  const draft = { ...current };
  const result = mutator(draft);
  if (!result.ok) return result;
  const version = readMetaVersion(current);
  return {
    ok: true,
    next: {
      ...result.next,
      [META_VERSION_KEY]: version + 1,
    },
  };
}

export async function updatePublicMetadataAtomic<TUser extends ClerkUserLike>(opts: {
  userId: string;
  getUser: (id: string) => Promise<TUser>;
  updateUser: (id: string, data: { publicMetadata: PublicMeta }) => Promise<TUser>;
  mutator: (draft: PublicMeta, user: TUser) => MetaMutatorResult;
  maxAttempts?: number;
}): Promise<{ user: TUser } | { error: string; status: number }> {
  return withUserLock(opts.userId, async () => {
    const maxAttempts = opts.maxAttempts ?? 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const user = await opts.getUser(opts.userId);
      const current = { ...((user.publicMetadata || {}) as PublicMeta) };
      const applied = applyMetaMutation(current, (draft) => opts.mutator(draft, user));
      if (applied.ok === false) {
        return { error: applied.error, status: applied.status };
      }
      const updated = await opts.updateUser(opts.userId, { publicMetadata: applied.next });
      return { user: updated };
    }
    return { error: 'Concurrent update conflict; retry', status: 409 };
  });
}
