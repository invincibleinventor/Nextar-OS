import { useState, useLayoutEffect } from 'react';

/**
 * Hydration-safe hook to check if claymorphism UI style is active.
 * Returns `false` on the server and during initial hydration render,
 * then synchronously updates to `true` (if `.clay` is present) before
 * the browser paints, so there is no visible flash.
 */
export function useIsClay(): boolean {
  const [isClay, setIsClay] = useState(false);

  useLayoutEffect(() => {
    setIsClay(document.documentElement.classList.contains('clay'));
  }, []);

  return isClay;
}
