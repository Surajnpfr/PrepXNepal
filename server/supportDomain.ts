/**
 * Support / issue reports domain — pure helpers for the help-desk queue.
 */

export type SupportIssueCategory = 'technical' | 'content' | 'payment' | 'coins' | 'feedback';
export type SupportIssueStatus = 'open' | 'resolved';

export type SupportIssueRecord = {
  id: string;
  clerkUserId: string;
  userName: string;
  userEmail: string;
  category: SupportIssueCategory;
  body: string;
  status: SupportIssueStatus;
  staffNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolvedByClerkId: string | null;
};

export const SUPPORT_ISSUE_CATEGORIES = new Set<SupportIssueCategory>([
  'technical',
  'content',
  'payment',
  'coins',
  'feedback',
]);

export function isSupportIssueCategory(value: unknown): value is SupportIssueCategory {
  return typeof value === 'string' && SUPPORT_ISSUE_CATEGORIES.has(value as SupportIssueCategory);
}

import { isStaffRoleName } from './userRoles.ts';

/** Any staff role (or bootstrap admin) may triage support issues. */
export function canTriageSupportIssues(role: string | undefined, isBootstrap = false): boolean {
  return isStaffRoleName(role, isBootstrap);
}

export function normalizeIssueBody(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 4000);
}

/** Open first (oldest first = FIFO), then resolved newest-first. */
export function sortIssuesForQueue(issues: SupportIssueRecord[]): SupportIssueRecord[] {
  const open = issues
    .filter((i) => i.status === 'open')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rest = issues
    .filter((i) => i.status !== 'open')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...open, ...rest];
}
