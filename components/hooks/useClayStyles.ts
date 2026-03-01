/**
 * Shared glass style objects for clay mode.
 * Uses light/medium blur for performance — NOT heavy blur everywhere.
 * Import these instead of defining inline styles per-component.
 */

/** Glass panel — translucent bg, light blur, glass border + shadow. Used for major containers (dock pills, panels, dialogs). */
export const glassPanel: React.CSSProperties = {
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(var(--glass-blur))',
  WebkitBackdropFilter: 'blur(var(--glass-blur))',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--glass-shadow)',
};

/** Alias for semantic clarity on pill-shaped elements */
export const glassPill = glassPanel;

/** Glass card — lighter glass for inner cards within already-blurred containers. No extra blur to stay performant. */
export const glassCard: React.CSSProperties = {
  background: 'var(--bg-glass)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-xs)',
};

/** Active glass card with pastel color tint + subtle glow */
export function glassCardActive(color: string): React.CSSProperties {
  return {
    background: `color-mix(in srgb, var(--pastel-${color}) 80%, var(--bg-glass) 20%)`,
    border: `1px solid color-mix(in srgb, var(--pastel-${color}) 30%, transparent)`,
    boxShadow: `0 4px 12px -4px color-mix(in srgb, var(--pastel-${color}) 30%, transparent)`,
  };
}

/** Glass button — for clickable elements */
export const glassButton: React.CSSProperties = {
  background: 'var(--bg-glass)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-xs)',
};

/** Inset well — recessed area for inactive icons, input backgrounds */
export const insetWell: React.CSSProperties = {
  background: 'var(--bg-glass-active)',
  boxShadow: 'var(--shadow-inset)',
};

/** Glass sidebar — translucent sidebar with blur + right border */
export const glassSidebar: React.CSSProperties = {
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(var(--glass-blur-heavy))',
  WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
  borderRight: '1px solid var(--glass-border)',
};

/** Glass input — for text inputs, search bars. Clean and subtle, no inset shadow. */
export const glassInput: React.CSSProperties = {
  background: 'var(--bg-glass-active)',
  border: '1px solid var(--glass-border)',
};

// Keep old names as aliases for backwards compat with existing imports
export const neoCard = glassCard;
export const neoButton = glassButton;
export const sidebarStyle = glassSidebar;

export function neoCardActive(color: string) { return glassCardActive(color); }

/** Common Tailwind class fragments for clay mode */
export const clayClasses = {
  card: 'rounded-[16px] transition-all',
  pill: 'rounded-full',
  separator: 'border-[--glass-border]',
  interactivePress: 'active:scale-[0.97]',
  radiusSm: 'rounded-[12px]',
  radiusMd: 'rounded-[16px]',
  radiusLg: 'rounded-[22px]',
};
