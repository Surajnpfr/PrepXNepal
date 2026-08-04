/**
 * Central SEO / AEO / GEO copy and JSON-LD builders for PrepX Nepal.
 * Canonical host defaults to production HTTPS (override with VITE_SITE_URL).
 */

import { SUPPORT_EMAIL, SUPPORT_INSTAGRAM_URL } from './supportContacts';

export const SITE_NAME = 'PrepX Nepal';
export const SITE_DEFAULT_ORIGIN = 'https://prepxnepal.com';

export function getSiteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return SITE_DEFAULT_ORIGIN;
    }
    return `${protocol}//${hostname}`;
  }
  return SITE_DEFAULT_ORIGIN;
}

export type PageSeoConfig = {
  title: string;
  description: string;
  path: string;
  h1: string;
  type?: 'website' | 'article';
  faqs?: { question: string; answer: string }[];
};

export const REPORTS_FAQS: { question: string; answer: string }[] = [
  {
    question: 'What is a CEE mock test performance report?',
    answer:
      'A CEE mock test performance report is a scored breakdown of your Nepal Medical Education Commission (MEC) style practice exam. PrepX Nepal shows overall marks out of 200, accuracy, predicted rank signals, and chapter-level strengths and weaknesses so you know what to revise next.',
  },
  {
    question: 'How should I use PrepX Nepal progress reports for Nepal CEE prep?',
    answer:
      'After each timed mock, open Progress Reports, compare your score trend to your target, then drill into weak chapters in Physics, Chemistry, Botany, Zoology, and MAT. Use that list to schedule the next study block in the planner and retake focused practice from the mock catalog.',
  },
  {
    question: 'Who are PrepX Nepal performance reports for?',
    answer:
      'They are for Nepal CEE / MBBS entrance aspirants who need chapter analytics, negative-marking-aware scoring (−0.25), and a clear study plan—not generic quiz scores. Parents and mentors can also review trends when a student shares a completed report.',
  },
  {
    question: 'Should I take another mock if my report score is low?',
    answer:
      'Yes—after you revise the weakest chapters shown in the report. PrepX Nepal is built for repeated timed mocks so each new report proves whether accuracy and rank signals are improving under MEC-style negative marking.',
  },
];

export const PAGE_SEO: Record<string, PageSeoConfig> = {
  landing: {
    path: '/',
    title: 'PrepX Nepal | Nepal CEE Online Mock Tests & Entrance Prep',
    description:
      'PrepX Nepal helps Nepal CEE aspirants take MEC-style mock tests, review chapter reports, and plan revision with Study Coins—built for MBBS entrance prep.',
    h1: 'Prepare for Nepal CEE with timed mocks and chapter reports',
  },
  reports: {
    path: '/reports',
    title: 'CEE Mock Performance Reports | PrepX Nepal Analytics',
    description:
      'Track Nepal CEE mock scores, chapter accuracy, and rank signals in PrepX Nepal progress reports. Built for MEC-style exams with −0.25 negative marking.',
    h1: 'CEE mock test performance reports for Nepal entrance prep',
    faqs: REPORTS_FAQS,
  },
  home: {
    path: '/home',
    title: 'Dashboard | PrepX Nepal CEE Prep',
    description:
      'Your PrepX Nepal dashboard for Nepal CEE mocks remaining, Study Coins, recent scores, and the next practice step.',
    h1: 'PrepX Nepal CEE prep dashboard',
  },
  catalog: {
    path: '/catalog',
    title: 'Nepal CEE Mock Tests Catalog | PrepX Nepal',
    description:
      'Browse timed Nepal CEE mock tests on PrepX Nepal—Physics, Chemistry, Botany, Zoology, and MAT with MEC-style scoring.',
    h1: 'Nepal CEE mock test catalog',
  },
  formulas: {
    path: '/formulas',
    title: 'CEE Formula Library | PrepX Nepal Study Resources',
    description:
      'Revise high-yield Physics, Chemistry, and Biology formulas for Nepal CEE with PrepX Nepal’s formula library.',
    h1: 'CEE formula library for Nepal medical entrance',
  },
  payment: {
    path: '/payment',
    title: 'Plans & Payment | PrepX Nepal Subscription',
    description:
      'Choose PrepX Nepal Premium or Unlimited plans for Nepal CEE mocks, then submit Fonepay payment for verification.',
    h1: 'PrepX Nepal plans and secure payment',
  },
  policies: {
    path: '/help',
    title: 'Help & Policies | PrepX Nepal',
    description:
      'Help centre, FAQs, terms, privacy, coins policy, and support for PrepX Nepal CEE aspirants.',
    h1: 'PrepX Nepal help and policies',
  },
};

export function seoForTab(tab: string | null, showLanding: boolean): PageSeoConfig {
  if (showLanding) return PAGE_SEO.landing;
  return PAGE_SEO[tab || 'home'] || {
    path: `/${tab || 'home'}`,
    title: `${SITE_NAME} | Nepal CEE Prep`,
    description: PAGE_SEO.landing.description,
    h1: SITE_NAME,
  };
}

export function absoluteUrl(path: string, origin = getSiteOrigin()): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${p}`;
}

export function buildOrganizationSchema(origin = getSiteOrigin()) {
  return {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: SITE_NAME,
    alternateName: ['PrepX', 'Prep X Nepal'],
    url: origin,
    logo: absoluteUrl('/icon-512.png', origin),
    email: SUPPORT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kathmandu',
      addressCountry: 'NP',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Nepal',
    },
    sameAs: ['https://www.mec.gov.np/', SUPPORT_INSTAGRAM_URL],
  };
}

export function buildSoftwareSchema(origin = getSiteOrigin()) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${origin}/#software`,
    name: SITE_NAME,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NPR',
    },
    description: PAGE_SEO.landing.description,
    provider: { '@id': `${origin}/#organization` },
  };
}

export function buildWebPageSchema(page: PageSeoConfig, origin = getSiteOrigin()) {
  const url = absoluteUrl(page.path, origin);
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': `${origin}/#website` },
    about: { '@id': `${origin}/#software` },
    publisher: { '@id': `${origin}/#organization` },
    inLanguage: 'en',
    dateModified: new Date().toISOString().slice(0, 10),
  };
}

export function buildBreadcrumbSchema(page: PageSeoConfig, origin = getSiteOrigin()) {
  const items = [
    { name: 'Home', path: '/' },
    ...(page.path !== '/'
      ? [{ name: page.h1.slice(0, 60), path: page.path }]
      : []),
  ];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  };
}

export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

export function buildGraph(page: PageSeoConfig, origin = getSiteOrigin()) {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: origin,
      name: SITE_NAME,
      description: PAGE_SEO.landing.description,
      publisher: { '@id': `${origin}/#organization` },
      inLanguage: 'en',
    },
    buildOrganizationSchema(origin),
    buildSoftwareSchema(origin),
    buildWebPageSchema(page, origin),
    buildBreadcrumbSchema(page, origin),
  ];
  if (page.faqs?.length) {
    graph.push(buildFaqSchema(page.faqs));
  }
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
