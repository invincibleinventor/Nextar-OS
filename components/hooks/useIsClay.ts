import { useState, useLayoutEffect, useEffect } from 'react';

/**
 * Hydration-safe hook to check if claymorphism UI style is active.
 * Returns `false` on the server and during initial hydration render,
 * then synchronously updates to `true` (if `.clay` is present) before
 * the browser paints, so there is no visible flash.
 *
 * Also watches for dynamic class changes (e.g. from config sync).
 */
export function useIsClay(): boolean {
  const [isClay, setIsClay] = useState(false);

  useLayoutEffect(() => {
    setIsClay(document.documentElement.classList.contains('clay'));
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsClay(document.documentElement.classList.contains('clay'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isClay;
}
