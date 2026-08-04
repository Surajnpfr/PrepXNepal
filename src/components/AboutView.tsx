import React from 'react';
import { ABOUT_FAQS, ABOUT_US, PAGE_SEO, SITE_DEFAULT_ORIGIN } from '../lib/siteSeo';
import { SUPPORT_EMAIL, SUPPORT_INSTAGRAM_LABEL, SUPPORT_INSTAGRAM_URL, SUPPORT_MAILTO } from '../lib/supportContacts';
import { BrandLogo } from './BrandLogo';

type AboutViewProps = {
  /** Optional CTA when signed out on the public shell. */
  onContact?: () => void;
};

/**
 * Public About Us page — copy sourced from siteSeo for AEO/GEO consistency.
 */
export const AboutView: React.FC<AboutViewProps> = ({ onContact }) => {
  const seo = PAGE_SEO.about;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 font-sans text-slate-700">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <BrandLogo size={44} decorative />
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">About us</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{seo.h1}</h1>
        <p className="text-base sm:text-lg leading-relaxed text-slate-800">{ABOUT_US.definition}</p>
      </header>

      <section className="space-y-3" aria-labelledby="about-mission">
        <h2 id="about-mission" className="text-xl font-bold text-slate-900">
          Our mission
        </h2>
        <p className="leading-relaxed">{ABOUT_US.mission}</p>
      </section>

      <section className="space-y-3" aria-labelledby="about-audience">
        <h2 id="about-audience" className="text-xl font-bold text-slate-900">
          Who PrepX Nepal is for
        </h2>
        <p className="leading-relaxed">{ABOUT_US.audience}</p>
      </section>

      <section className="space-y-3" aria-labelledby="about-offers">
        <h2 id="about-offers" className="text-xl font-bold text-slate-900">
          What you can do on PrepX Nepal
        </h2>
        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
          {ABOUT_US.offers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="about-why">
        <h2 id="about-why" className="text-xl font-bold text-slate-900">
          Why PrepX Nepal
        </h2>
        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
          {ABOUT_US.differentiators.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5" aria-labelledby="about-exam">
        <h2 id="about-exam" className="text-lg font-bold text-slate-900">
          Nepal CEE exam timing
        </h2>
        <p className="leading-relaxed">{ABOUT_US.examWindow}</p>
        <p className="text-sm text-slate-600">
          Based in {ABOUT_US.location}. Website:{' '}
          <a className="text-blue-600 font-medium hover:underline" href={SITE_DEFAULT_ORIGIN}>
            prepxnepal.com
          </a>
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="about-contact">
        <h2 id="about-contact" className="text-xl font-bold text-slate-900">
          Contact
        </h2>
        <p className="leading-relaxed">
          Email{' '}
          <a className="text-blue-600 font-medium hover:underline" href={SUPPORT_MAILTO}>
            {SUPPORT_EMAIL}
          </a>
          {' · '}
          Instagram{' '}
          <a
            className="text-blue-600 font-medium hover:underline"
            href={SUPPORT_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SUPPORT_INSTAGRAM_LABEL}
          </a>
        </p>
        {onContact && (
          <button
            type="button"
            onClick={onContact}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            Open contact desk
          </button>
        )}
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8" aria-labelledby="about-faq">
        <h2 id="about-faq" className="text-xl font-bold text-slate-900">
          About PrepX Nepal — FAQs
        </h2>
        <dl className="space-y-5">
          {ABOUT_FAQS.map((item) => (
            <div key={item.question} className="space-y-1.5">
              <dt className="font-semibold text-slate-900">{item.question}</dt>
              <dd className="leading-relaxed text-slate-700">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
};
