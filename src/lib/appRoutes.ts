/**
 * Central route map for PrepXNepal.
 * The app is a single-shell SPA; paths map 1:1 to workspace tabs.
 */

export const APP_TABS = [
  'home',
  'catalog',
  'mock-engine',
  'mock-study',
  'reports',
  'coins',
  'payment',
  'formulas',
  'saved',
  'planner',
  'leaderboard',
  'policies',
  'about',
  'admin',
] as const;

export type AppTab = (typeof APP_TABS)[number];

export const HELP_SUBTABS = [
  'contact',
  'issue',
  'feedback',
  'faq',
  'info',
  'workflow',
  'policies',
  'terms',
  'privacy',
  'coins-policy',
  'refund',
] as const;

export type HelpSubTab = (typeof HELP_SUBTABS)[number];

/** Legacy / marketing aliases → canonical tabs */
const TAB_ALIASES: Record<string, AppTab> = {
  home: 'home',
  dashboard: 'home',
  overview: 'home',
  catalog: 'catalog',
  mocks: 'catalog',
  'mock-tests': 'catalog',
  'mock-test': 'catalog',
  tests: 'catalog',
  'mock-engine': 'mock-engine',
  exam: 'mock-engine',
  'mock-study': 'mock-study',
  studypaper: 'mock-study',
  'study-mock': 'mock-study',
  'study-paper': 'mock-study',
  reports: 'reports',
  progress: 'reports',
  analytics: 'reports',
  coins: 'coins',
  wallet: 'coins',
  payment: 'payment',
  pricing: 'payment',
  plans: 'payment',
  subscription: 'payment',
  formulas: 'formulas',
  study: 'formulas',
  'study-resources': 'formulas',
  resources: 'formulas',
  revision: 'formulas',
  saved: 'saved',
  bookmarks: 'saved',
  planner: 'planner',
  'study-plan': 'planner',
  schedule: 'planner',
  leaderboard: 'leaderboard',
  ranks: 'leaderboard',
  policies: 'policies',
  help: 'policies',
  support: 'policies',
  info: 'policies',
  about: 'about',
  'about-us': 'about',
  admin: 'admin',
  desk: 'admin',
};

const PATH_BY_TAB: Record<AppTab, string> = {
  home: '/home',
  catalog: '/catalog',
  'mock-engine': '/exam',
  'mock-study': '/study-paper',
  reports: '/reports',
  coins: '/coins',
  payment: '/payment',
  formulas: '/formulas',
  saved: '/saved',
  planner: '/planner',
  leaderboard: '/leaderboard',
  policies: '/help',
  about: '/about',
  admin: '/admin',
};

export type AppLocation =
  | { surface: 'landing' }
  | { surface: 'app'; tab: AppTab; helpSubTab: HelpSubTab }
  | { surface: 'not-found'; attemptedPath: string };

export function isAppTab(value: string): value is AppTab {
  return (APP_TABS as readonly string[]).includes(value);
}

export function isHelpSubTab(value: string): value is HelpSubTab {
  return (HELP_SUBTABS as readonly string[]).includes(value);
}

/** Map any nav id / alias / legacy string to a canonical tab. */
export function resolveAppTab(input?: string | null, fallback: AppTab = 'home'): AppTab {
  if (!input) return fallback;
  const key = input.trim().toLowerCase().replace(/^\/+/, '');
  if (isAppTab(key)) return key;
  return TAB_ALIASES[key] ?? fallback;
}

export function buildAppPath(
  tab: AppTab,
  helpSubTab?: HelpSubTab,
  opts?: { asContact?: boolean }
): string {
  if (tab === 'policies' && (helpSubTab === 'contact' || opts?.asContact)) {
    return '/contact';
  }
  const base = PATH_BY_TAB[tab];
  if (tab === 'policies' && helpSubTab && helpSubTab !== 'info') {
    return `${base}/${helpSubTab}`;
  }
  return base;
}

export function parseAppLocation(pathname = window.location.pathname): AppLocation {
  const raw = pathname.replace(/\/+$/, '') || '/';
  const segments = raw.split('/').filter(Boolean);

  if (segments.length === 0 || raw === '/') {
    return { surface: 'landing' };
  }

  // Accept both /help/faq and /policies/faq
  const root = segments[0].toLowerCase();
  const second = segments[1]?.toLowerCase();

  if (root === 'welcome' || root === 'landing') {
    return { surface: 'landing' };
  }

  // /contact → dedicated contact desk (not CEE Rules)
  if (root === 'contact') {
    if (segments.length > 1) {
      return { surface: 'not-found', attemptedPath: raw };
    }
    return { surface: 'app', tab: 'policies', helpSubTab: 'contact' };
  }

  // /help or /policies[/:sub]
  if (root === 'help' || root === 'policies') {
    const sub = second && isHelpSubTab(second) ? second : 'info';
    if (second && !isHelpSubTab(second)) {
      return { surface: 'not-found', attemptedPath: raw };
    }
    return { surface: 'app', tab: 'policies', helpSubTab: sub };
  }

  // Reverse lookup from path segment
  const tabFromPath = (Object.entries(PATH_BY_TAB) as [AppTab, string][]).find(
    ([, path]) => path === `/${root}`
  )?.[0];

  if (tabFromPath) {
    if (segments.length > 1 && tabFromPath !== 'policies') {
      return { surface: 'not-found', attemptedPath: raw };
    }
    return {
      surface: 'app',
      tab: tabFromPath,
      helpSubTab: 'info',
    };
  }

  // Alias first segment (e.g. /mocks → catalog)
  const aliased = TAB_ALIASES[root];
  if (aliased) {
    return {
      surface: 'app',
      tab: aliased,
      helpSubTab: second && isHelpSubTab(second) ? second : 'info',
    };
  }

  return { surface: 'not-found', attemptedPath: raw };
}

export type NavigateOptions = {
  replace?: boolean;
  helpSubTab?: HelpSubTab;
  /** Skip history write (internal sync only). */
  silent?: boolean;
  /** Emit /contact instead of /help when opening the contact desk. */
  asContact?: boolean;
};

export function writeAppHistory(
  tab: AppTab,
  opts: NavigateOptions = {}
): void {
  if (opts.silent || typeof window === 'undefined') return;
  const path = buildAppPath(tab, opts.helpSubTab, { asContact: opts.asContact });
  const method = opts.replace ? 'replaceState' : 'pushState';
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === path || current.startsWith(`${path}?`)) {
    if (opts.replace) window.history.replaceState({ tab }, '', path);
    return;
  }
  window.history[method]({ tab }, '', path);
}

export function writeLandingHistory(replace = false): void {
  if (typeof window === 'undefined') return;
  const method = replace ? 'replaceState' : 'pushState';
  if (window.location.pathname === '/' || window.location.pathname === '') {
    window.history.replaceState({ surface: 'landing' }, '', '/');
    return;
  }
  window.history[method]({ surface: 'landing' }, '', '/');
}
