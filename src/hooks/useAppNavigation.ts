import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AppTab,
  type HelpSubTab,
  type NavigateOptions,
  parseAppLocation,
  resolveAppTab,
  writeAppHistory,
  writeLandingHistory,
} from '../lib/appRoutes';

export type AppNavState = {
  surface: 'landing' | 'app' | 'not-found';
  tab: AppTab;
  helpSubTab: HelpSubTab;
  attemptedPath: string | null;
};

function readInitialNav(): AppNavState {
  const loc = parseAppLocation();
  if (loc.surface === 'landing') {
    return { surface: 'landing', tab: 'home', helpSubTab: 'info', attemptedPath: null };
  }
  if (loc.surface === 'not-found') {
    return {
      surface: 'not-found',
      tab: 'home',
      helpSubTab: 'info',
      attemptedPath: loc.attemptedPath,
    };
  }
  return {
    surface: 'app',
    tab: loc.tab,
    helpSubTab: loc.helpSubTab,
    attemptedPath: null,
  };
}

/**
 * Syncs workspace tab / help sub-tab with the browser URL and history stack.
 */
export function useAppNavigation() {
  const [nav, setNav] = useState<AppNavState>(() => readInitialNav());
  const navRef = useRef(nav);
  navRef.current = nav;

  const applyLocation = useCallback(() => {
    const loc = parseAppLocation();
    if (loc.surface === 'landing') {
      setNav({ surface: 'landing', tab: 'home', helpSubTab: 'info', attemptedPath: null });
      return;
    }
    if (loc.surface === 'not-found') {
      setNav({
        surface: 'not-found',
        tab: 'home',
        helpSubTab: 'info',
        attemptedPath: loc.attemptedPath,
      });
      return;
    }
    setNav({
      surface: 'app',
      tab: loc.tab,
      helpSubTab: loc.helpSubTab,
      attemptedPath: null,
    });
  }, []);

  useEffect(() => {
    const onPop = () => applyLocation();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [applyLocation]);

  const goToTab = useCallback((rawTab: string, opts: NavigateOptions = {}) => {
    const tab = resolveAppTab(rawTab);
    const helpSubTab =
      tab === 'policies'
        ? opts.helpSubTab ?? (navRef.current.tab === 'policies' ? navRef.current.helpSubTab : 'info')
        : 'info';

    setNav({
      surface: 'app',
      tab,
      helpSubTab: tab === 'policies' ? helpSubTab : 'info',
      attemptedPath: null,
    });
    writeAppHistory(tab, {
      replace: opts.replace,
      helpSubTab: tab === 'policies' ? helpSubTab : undefined,
      silent: opts.silent,
      asContact: opts.asContact,
    });
    if (!opts.silent) {
      window.scrollTo(0, 0);
    }
  }, []);

  const goToLanding = useCallback((replace = false) => {
    setNav({ surface: 'landing', tab: 'home', helpSubTab: 'info', attemptedPath: null });
    writeLandingHistory(replace);
    window.scrollTo({ top: 0 });
  }, []);

  const enterApp = useCallback(
    (initialCategory?: string, replace = false) => {
      const tab = resolveAppTab(initialCategory, 'home');
      goToTab(tab, { replace });
    },
    [goToTab]
  );

  const setHelpSubTab = useCallback((sub: HelpSubTab, replace = true) => {
    setNav((prev) => ({
      ...prev,
      surface: 'app',
      tab: 'policies',
      helpSubTab: sub,
      attemptedPath: null,
    }));
    writeAppHistory('policies', { replace, helpSubTab: sub });
  }, []);

  return {
    nav,
    goToTab,
    goToLanding,
    enterApp,
    setHelpSubTab,
    showLanding: nav.surface === 'landing',
    showNotFound: nav.surface === 'not-found',
    activeTab: nav.tab,
    helpSubTab: nav.helpSubTab,
    attemptedPath: nav.attemptedPath,
  };
}
