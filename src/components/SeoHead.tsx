import { useEffect } from 'react';
import { trackSpaPageView } from '../lib/analytics';
import { absoluteUrl, buildGraph, getSiteOrigin, type PageSeoConfig } from '../lib/siteSeo';

const JSON_LD_ID = 'prepx-jsonld';
const META_MARK = 'data-prepx-seo';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute(META_MARK, '1');
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    el.setAttribute(META_MARK, '1');
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Keeps document title, social meta, canonical, and JSON-LD in sync with the active surface.
 */
export function SeoHead({ page }: { page: PageSeoConfig }) {
  useEffect(() => {
    const origin = getSiteOrigin();
    const url = absoluteUrl(page.path, origin);
    const image = absoluteUrl('/og-image.png?v=20260804b', origin);

    document.title = page.title;
    upsertMeta('name', 'description', page.description);
    upsertMeta('name', 'author', 'PrepX Nepal');
    upsertMeta('name', 'robots', 'index, follow');
    upsertLink('canonical', url);

    upsertMeta('property', 'og:type', page.type || 'website');
    upsertMeta('property', 'og:site_name', 'PrepX Nepal');
    upsertMeta('property', 'og:title', page.title);
    upsertMeta('property', 'og:description', page.description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:type', 'image/png');
    upsertMeta('property', 'og:image:width', '1024');
    upsertMeta('property', 'og:image:height', '537');
    upsertMeta('property', 'og:image:alt', 'PrepX Nepal — Nepal CEE Online Mock Tests');
    upsertMeta('property', 'og:locale', 'en_NP');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', page.title);
    upsertMeta('name', 'twitter:description', page.description);
    upsertMeta('name', 'twitter:image', image);

    let script = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSON_LD_ID;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildGraph(page, origin));
    trackSpaPageView(page.path, page.title);
  }, [page]);

  return null;
}
