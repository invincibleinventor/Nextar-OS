# NextarOS Design System

## Aesthetic
Flat pastel anime-inspired desktop OS. No rounded corners on interactive elements (buttons, inputs, panels) — everything is sharp/square. Clean, minimal, monospace-first typography. Soft colored shadows, subtle accent glows, and gradient fades give depth without heaviness.

## Color Palette

### Base Colors (3-layer depth system)
| Token | Tailwind | Light (Catppuccin Latte base) | Dark (Catppuccin Macchiato base) |
|-------|----------|------|------|
| `--bg-base` | `bg-base` | `#eff1f5` | `#161822` |
| `--bg-surface` | `bg-surface` | `#e6e9ef` | `#1e2030` |
| `--bg-overlay` | `bg-overlay` | `#dce0e8` | `#24263a` |

**Hierarchy**: `bg-base` = page/canvas background. `bg-surface` = sidebars, toolbars, panels. `bg-overlay` = hover states, cards, inputs.

### Text
| Token | Usage |
|-------|-------|
| `--text-color` | Primary text. `text-[--text-color]` |
| `--text-muted` | Secondary/label text. `text-[--text-muted]` |

### Border
Always `border-[--border-color]`. Never `border-gray-*`. Separators use `<div className="w-px h-5 bg-[--border-color]" />` (vertical) or `<div className="h-px bg-[--border-color]" />` (horizontal).

### Accent Color
`--accent-color` / `bg-accent` / `text-accent`. User-configurable. Default `#e78284` (Catppuccin Frappé red).

### Pastel Palette (Catppuccin Frappé for light, Macchiato for dark)
All available as `bg-pastel-*` / `text-pastel-*` or `var(--pastel-*)`:

| Name | Light (Frappé) | Dark (Macchiato) |
|------|----------------|------------------|
| red | `#e78284` | `#ed8796` |
| peach | `#ef9f76` | `#f5a97f` |
| yellow | `#e5c890` | `#eed49f` |
| green | `#a6d189` | `#a6da95` |
| teal | `#81c8be` | `#8bd5ca` |
| blue | `#8caaee` | `#8aadf4` |
| lavender | `#babbf1` | `#b7bdf8` |
| pink | `#f4b8e4` | `#f5bde6` |
| mauve | `#ca9ee6` | `#c6a0f6` |

## Typography
- **Primary font**: `font-mono` (JetBrains Mono / system monospace)
- **System font**: `font-sf` (SF Pro) — used sparingly
- **Sizes**: `text-[13px]` body, `text-[12px]` secondary, `text-[11px]` labels/captions, `text-[10px]` tiny labels
- **Section headers**: `text-[11px] uppercase font-semibold text-[--text-muted] tracking-wide`

## Layout Patterns

### Sidebar + Content (standard app layout)
```tsx
<div className="flex h-full w-full bg-[--bg-base] text-[--text-color] font-mono overflow-hidden">
  {/* Sidebar: 180-260px, surface bg, right border, gradient top */}
  <div className="w-[200px] border-r border-[--border-color] bg-surface flex flex-col h-full anime-gradient-top shrink-0">
    {/* Section label */}
    <div className="text-[11px] uppercase font-semibold text-[--text-muted] px-3 pt-3 pb-1">Section</div>
    {/* Items */}
    <div className="flex-1 overflow-y-auto px-2">...</div>
  </div>
  {/* Content */}
  <div className="flex-1 flex flex-col min-w-0">
    {/* Top bar (optional) */}
    <div className="h-10 border-b border-[--border-color] bg-surface flex items-center px-3 shrink-0">...</div>
    {/* Main content */}
    <div className="flex-1 overflow-y-auto p-4">...</div>
  </div>
</div>
```

### Toolbar
```tsx
<div className="flex items-center gap-1 px-3 py-1.5 border-b border-[--border-color] bg-surface shrink-0">
```

## Interactive States

### Buttons / Selectable Items
- **Default**: `text-[--text-color] hover:bg-overlay transition-colors`
- **Active/selected**: `bg-accent text-[--bg-base]`
- **Soft selected**: `bg-accent/10 text-accent`
- **Disabled**: `opacity-30 cursor-not-allowed`
- **Icon button**: `p-1.5 text-[--text-muted] hover:bg-overlay hover:text-[--text-color] transition-colors`

### Sidebar List Item (Settings-style)
```tsx
<div className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-colors
  ${active ? 'bg-accent text-[--bg-base]' : 'text-[--text-color] hover:bg-overlay'}`}>
  <div className="w-5 h-5 flex items-center justify-center text-[--bg-base] shrink-0"
       style={{ backgroundColor: active ? 'transparent' : 'var(--pastel-blue)' }}>
    <Icon size={12} />
  </div>
  <span className="text-[13px] font-medium">{label}</span>
</div>
```

### Color Swatch Picker
```tsx
<button
  className={`w-6 h-6 transition-all ${selected ? 'ring-2 ring-offset-1 ring-[--text-muted] scale-110' : 'hover:scale-105'}`}
  style={{ backgroundColor: color }}
/>
```

## Inputs
```tsx
<input className="bg-overlay border border-[--border-color] px-3 py-1 text-[13px] outline-none text-[--text-color] placeholder-[--text-muted] focus:border-accent transition-all" />
```
Or use the `.input-pastel` CSS class.

## Special Utility Classes
- `anime-gradient-top` — sidebar top fade with accent
- `anime-glow` / `anime-glow-sm` / `anime-glow-lg` — accent glow shadows
- `anime-hover` — translateY(-1px) + glow on hover
- `anime-focus` — accent focus ring
- `anime-card` — surface bg + border + hover glow
- `anime-active` — bottom 2px accent bar
- `anime-tab-active` — centered accent underline
- `anime-shimmer` — animated shimmer
- `shadow-pastel` / `shadow-pastel-lg` — multi-color pastel shadow
- `shadow-pastel-pink/blue/mauve/teal` — single-color pastel shadows
- `icon-bg-red/peach/yellow/green/teal/blue/lavender/pink/mauve` — icon background

## Shadows
Use `color-mix(in srgb, var(--pastel-*) N%, transparent)` for theme-aware shadows. Never hardcode rgba with specific color values.

## Key Rules
1. **No rounded corners** on buttons, inputs, panels, cards. Everything is square/sharp.
2. **Always use CSS variables** for colors — never hardcode hex values for theme colors.
3. **Monospace first** — `font-mono` is the default. SF Pro only for specific UI elements.
4. **Flat design** — no gradients on buttons/cards. Depth comes from shadow-pastel and bg layers.
5. **Pastel colored icon boxes** — small colored squares with white icons inside (Settings sidebar style).
6. **Minimal chrome** — thin borders, subtle separators, small font sizes.
7. **Theme-aware** — all visual elements must work in both light and dark themes via CSS variables.
