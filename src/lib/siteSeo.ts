/**
 * Central SEO / AEO / GEO copy and JSON-LD builders for PrepX Nepal.
 * Canonical host defaults to production HTTPS (override with VITE_SITE_URL).
 *
 * AEO/GEO rules for this file:
 * - Lead with a clear entity definition (who / what / for whom / where).
 * - Prefer answer-ready sentences answer engines can quote.
 * - Keep About Us prose here so UI + meta + schema stay one source of truth.
 */

import { SUPPORT_EMAIL, SUPPORT_INSTAGRAM_URL } from './supportContacts';
import { TENTATIVE_EXAM_LABEL } from './examSchedule';

export const SITE_NAME = 'PrepX Nepal';
export const SITE_DEFAULT_ORIGIN = 'https://prepxnepal.com';

/** Primary SERP / social / JSON-LD description (~155–160 chars). */
export const SITE_META_DESCRIPTION =
  'PrepX Nepal is Nepal’s online CEE prep platform for MBBS entrance. Practice MEC-style timed mocks (Physics, Chemistry, Botany, Zoology, MAT), get chapter reports, and revise with Study Coins.';

export function getSiteOrigin(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const fromEnv = env?.VITE_SITE_URL?.trim();
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

/** About Us — structured for humans + answer/generative engines. */
export const ABOUT_US = {
  name: SITE_NAME,
  /** First paragraph answer engines should cite. */
  definition:
    'PrepX Nepal is an online Nepal CEE (Common Entrance Examination) preparation platform for MBBS and other medical entrance aspirants in Nepal. It provides MEC-style timed mock tests, chapter-level performance reports, and revision tools with Study Coins.',
  mission:
    'Help Nepal CEE aspirants practice under real exam pressure—200 questions, timed papers, and −0.25 negative marking—then turn each attempt into a clear revision plan.',
  audience:
    'Nepal Medical Education Commission (MEC) CEE / MBBS entrance students, plus parents and mentors who review progress reports.',
  location: 'Kathmandu, Nepal',
  examWindow: `${TENTATIVE_EXAM_LABEL} (official MEC date TBA)`,
  website: SITE_DEFAULT_ORIGIN,
  email: SUPPORT_EMAIL,
  offers: [
    'Timed full-length and chapter/subject practice mocks for Physics, Chemistry, Botany, Zoology, and MAT',
    'MEC-style scoring with −0.25 negative marking',
    'Chapter-level progress reports and rank-style signals after each mock',
    'Study mode to review papers with answers',
    'Study Coins, study planner, and formula library for daily revision',
    'Free, Premium, and Unlimited plans with Fonepay payment verification',
  ],
  differentiators: [
    'Built specifically for Nepal CEE conventions—not a generic global quiz app',
    'Reports that map mistakes to chapters so revision is actionable',
    'Public help, pricing, and contact pages for transparent support',
  ],
} as const;

export const ABOUT_FAQS: { question: string; answer: string }[] = [
  {
    question: 'What is PrepX Nepal?',
    answer: ABOUT_US.definition,
  },
  {
    question: 'Who is PrepX Nepal for?',
    answer: ABOUT_US.audience,
  },
  {
    question: 'What subjects does PrepX Nepal cover for Nepal CEE?',
    answer:
      'PrepX Nepal covers Physics, Chemistry, Botany, Zoology, and MAT (Mental Ability Test) with full papers and subject- or chapter-wise practice aligned to MEC-style exams.',
  },
  {
    question: 'When is the Nepal CEE exam according to PrepX Nepal?',
    answer: `The official MEC date is not fixed yet. PrepX Nepal lists the tentative window as ${ABOUT_US.examWindow}. Countdown days appear only after a confirmed date is set.`,
  },
  {
    question: 'How do I contact PrepX Nepal?',
    answer: `Email ${SUPPORT_EMAIL} or message Instagram @PrepxNepal. You can also open the Contact page on ${SITE_DEFAULT_ORIGIN}/contact.`,
  },
];

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
    title: 'PrepX Nepal | Nepal CEE Online Mock Tests & MBBS Entrance Prep',
    description: SITE_META_DESCRIPTION,
    h1: 'Prepare for Nepal CEE with timed mocks and chapter reports',
    faqs: ABOUT_FAQS.slice(0, 3),
  },
  about: {
    path: '/about',
    title: 'About PrepX Nepal | Nepal CEE Prep Platform',
    description:
      'About PrepX Nepal: the Nepal CEE / MBBS entrance prep platform for MEC-style timed mocks, chapter reports, Study Coins, and revision tools—based in Kathmandu, Nepal.',
    h1: 'About PrepX Nepal',
    faqs: ABOUT_FAQS,
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
      'Choose PrepX Nepal Free, Premium, or Unlimited plans for Nepal CEE mocks, then submit Fonepay payment for verification.',
    h1: 'PrepX Nepal plans and secure payment',
  },
  policies: {
    path: '/help',
    title: 'Help & Policies | PrepX Nepal',
    description:
      'Help centre, FAQs, terms, privacy, coins policy, and support for PrepX Nepal CEE aspirants in Nepal.',
    h1: 'PrepX Nepal help and policies',
  },
};

export function seoForTab(tab: string | null, showLanding: boolean): PageSeoConfig {
  if (showLanding) return PAGE_SEO.landing;
  return (
    PAGE_SEO[tab || 'home'] || {
      path: `/${tab || 'home'}`,
      title: `${SITE_NAME} | Nepal CEE Prep`,
      description: SITE_META_DESCRIPTION,
      h1: SITE_NAME,
    }
  );
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
    alternateName: ['PrepX', 'Prep X Nepal', 'PrepXNepal'],
    legalName: SITE_NAME,
    description: ABOUT_US.definition,
    slogan: 'Nepal CEE mock tests, reports, and revision in one place',
    url: origin,
    logo: absoluteUrl('/icon-512.png', origin),
    image: absoluteUrl('/og-image.png?v=20260804b', origin),
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
    knowsAbout: [
      'Nepal CEE',
      'MBBS entrance exam Nepal',
      'Medical Education Commission MEC',
      'Mock test preparation',
      'Physics Chemistry Botany Zoology MAT',
    ],
    sameAs: ['https://www.mec.gov.np/', SUPPORT_INSTAGRAM_URL],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
      availableLanguage: ['English', 'Nepali'],
      url: absoluteUrl('/contact', origin),
    },
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
    description: SITE_META_DESCRIPTION,
    featureList: [...ABOUT_US.offers],
    provider: { '@id': `${origin}/#organization` },
    url: origin,
  };
}

export function buildAboutPageSchema(page: PageSeoConfig, origin = getSiteOrigin()) {
  const url = absoluteUrl(page.path, origin);
  return {
    '@type': 'AboutPage',
    '@id': `${url}#aboutpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': `${origin}/#website` },
    about: { '@id': `${origin}/#organization` },
    mainEntity: { '@id': `${origin}/#organization` },
    publisher: { '@id': `${origin}/#organization` },
    inLanguage: 'en',
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
      alternateName: ['PrepX', 'PrepXNepal'],
      description: SITE_META_DESCRIPTION,
      publisher: { '@id': `${origin}/#organization` },
      inLanguage: 'en',
    },
    buildOrganizationSchema(origin),
    buildSoftwareSchema(origin),
  ];

  if (page.path === '/about') {
    graph.push(buildAboutPageSchema(page, origin));
  } else {
    graph.push(buildWebPageSchema(page, origin));
  }

  graph.push(buildBreadcrumbSchema(page, origin));

  if (page.faqs?.length) {
    graph.push(buildFaqSchema(page.faqs));
  }
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
