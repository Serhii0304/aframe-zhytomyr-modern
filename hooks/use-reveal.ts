'use client';

import { useEffect, useRef } from 'react';

/** Progressive enhancement: one observer, one entrance per block, no scroll loop. */
export function useReveal() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = root.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!container || preference.matches || !('IntersectionObserver' in window))
      return;

    const elements = [
      ...container.querySelectorAll<HTMLElement>('[data-reveal]'),
    ];
    // Never hide content that is already being read, including deep-linked sections.
    const candidates = elements.filter(
      (element) => element.getBoundingClientRect().top >= window.innerHeight,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.removeAttribute('data-reveal-pending');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -32px 0px', threshold: 0 },
    );

    const revealAll = () => {
      observer.disconnect();
      for (const element of candidates)
        element.removeAttribute('data-reveal-pending');
    };
    const onPreferenceChange = () => {
      if (preference.matches) revealAll();
    };
    // Keyboard navigation must reveal a block immediately, without waiting for scrolling.
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const block = event.target.closest('[data-reveal-pending]');
      if (block) {
        block.removeAttribute('data-reveal-pending');
        observer.unobserve(block);
      }
    };

    for (const element of candidates) {
      element.setAttribute('data-reveal-pending', '');
      observer.observe(element);
    }
    preference.addEventListener('change', onPreferenceChange);
    container.addEventListener('focusin', onFocus);
    return () => {
      revealAll();
      preference.removeEventListener('change', onPreferenceChange);
      container.removeEventListener('focusin', onFocus);
    };
  }, []);

  return root;
}
