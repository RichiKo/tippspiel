import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs';

export interface SeoMetadata {
  title: string;
  description: string;
  robots: 'index,follow' | 'noindex,nofollow';
}

const SEO_SITE_URL = 'https://tippsliga.com';
const DEFAULT_SEO: SeoMetadata = {
  title: 'TippsLiga | Fussball Tippspiel / Футбольний конкурс прогнозів',
  description:
    'TippsLiga ist dein digitales Fussball-Tippspiel fuer private Ligen und Freunde. TippsLiga — цифровий футбольний конкурс прогнозів для приватних ліг та друзів.',
  robots: 'noindex,nofollow',
};

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private isInitialized = false;

  init(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
      )
      .subscribe(() => this.applyCurrentRouteMetadata());
  }

  private applyCurrentRouteMetadata(): void {
    const seo = this.resolveCurrentRouteSeo() ?? DEFAULT_SEO;
    const canonicalUrl = this.buildCanonicalUrl();

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: seo.robots });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({
      property: 'og:image',
      content: `${SEO_SITE_URL}/assets/branding/tippsliga-logo-mark.png`,
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({
      name: 'twitter:image',
      content: `${SEO_SITE_URL}/assets/branding/tippsliga-logo-mark.png`,
    });

    this.updateCanonicalTag(canonicalUrl);
  }

  private resolveCurrentRouteSeo(): SeoMetadata | null {
    const root = this.router.routerState.snapshot.root;
    let current: ActivatedRouteSnapshot | null = root;
    let resolvedSeo: SeoMetadata | null = null;

    while (current) {
      const candidate = current.data['seo'] as SeoMetadata | undefined;
      if (candidate) {
        resolvedSeo = candidate;
      }
      current = current.firstChild;
    }

    return resolvedSeo;
  }

  private buildCanonicalUrl(): string {
    const currentPath = this.router.url.split('?')[0]?.split('#')[0] ?? '/';
    const normalizedPath =
      currentPath.trim().length === 0
        ? '/'
        : currentPath.startsWith('/')
          ? currentPath
          : `/${currentPath}`;

    return `${SEO_SITE_URL}${normalizedPath}`;
  }

  private updateCanonicalTag(url: string): void {
    const head = this.document.head;
    let canonicalElement = head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );

    if (!canonicalElement) {
      canonicalElement = this.document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      head.appendChild(canonicalElement);
    }

    canonicalElement.setAttribute('href', url);
  }
}
