# NextarOS — Soft Glass Design System (Clay Mode)

Reference: Aladin OS. Frosted translucent glass surfaces over accent-tinted backgrounds.
All rules apply ONLY when clay mode is active (`.clay` class on `<html>`). Classic mode retains the anime/Catppuccin theme unchanged.

---

## 1. Mode Gating

- **Clay mode ON**: `document.documentElement.classList.contains('clay')` → apply this design system
- **Clay mode OFF**: Original theme — Catppuccin pastels, macOS traffic light dots, individual icon colors
- Use `useIsClay()` hook in React components: `const clay = useIsClay();`
- All CSS tokens are scoped under `.clay { ... }` and `.clay.dark { ... }`
- Conditional rendering: `clay ? <ClayVersion /> : <ClassicVersion />`
- Conditional classes: `${clay ? 'rounded-[16px]' : ''}`
- Conditional styles: `style={clay ? glassPanel : undefined}`

---

## 2. Color Foundation

### 2.1 Light Mode Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `color-mix(in srgb, var(--accent-color) 5%, #E6EFF8)` | Page background, soft sky-blue lavender |
| `--bg-surface` | `#FFFFFF` | Card backgrounds, elevated containers |
| `--bg-overlay` | `color-mix(in srgb, var(--accent-color) 3%, #EBF2FC)` | Sidebar bg, overlay backgrounds |
| `--bg-elevated` | `color-mix(in srgb, var(--accent-color) 4%, #F5F8FD)` | Elevated surfaces, hover states |
| `--text-color` | `#1A2038` | Primary text, dark navy |
| `--text-muted` | `#6878A0` | Secondary text, labels, slate blue |
| `--border-color` | accent-tinted `rgba(120, 140, 200, 0.16)` | Standard borders |
| `--border-subtle` | accent-tinted `rgba(120, 140, 200, 0.08)` | Subtle separators |

### 2.2 Dark Mode Tokens (Navy-Black, NOT Purple)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `color-mix(in srgb, var(--accent-color) 3%, #0B0E18)` | Deep navy-black background |
| `--bg-surface` | `color-mix(in srgb, var(--accent-color) 2%, #141824)` | Dark navy surfaces |
| `--bg-overlay` | `color-mix(in srgb, var(--accent-color) 4%, #1C2030)` | Slightly lighter navy |
| `--bg-elevated` | `color-mix(in srgb, var(--accent-color) 4%, #242838)` | Elevated surfaces |
| `--text-color` | `#D8DCE8` | Primary text, light gray |
| `--text-muted` | `#6A7090` | Secondary text, muted blue-gray |
| `--border-color` | accent-tinted `rgba(100, 120, 180, 0.14)` | Standard borders |
| `--border-subtle` | accent-tinted `rgba(100, 120, 180, 0.07)` | Subtle separators |

### 2.3 Accent System (`--accent-source` → `--accent-color` → `--accent-gradient`)

Three-layer accent system:

1. **`--accent-source`**: Raw user-chosen color (e.g., `#e78284` red, `#a6d189` green). Set via `document.documentElement.style.setProperty('--accent-source', color)` in SettingsContext.

2. **`--accent-color`**: Derived flat tint for borders, focus rings, subtle highlights.
   - Classic mode: `var(--accent-source)` (raw, no mixing)
   - Clay mode: `color-mix(in srgb, var(--accent-source) 55%, var(--pastel-lavender))` (softened)

3. **`--accent-gradient`**: Rich gradient matching icon tint. Used for active items, toggles, badges.
   - Light: `linear-gradient(135deg, accent-source 48% + pastel-blue, accent-source 30% + pastel-lavender)`
   - Dark: `linear-gradient(135deg, accent-source 72% + pastel-blue, accent-source 55% + pastel-lavender)`

4. **`--accent-shadow`**: Accent-tinted glow shadow for accented elements.
   - Light: `0 2px 10px -2px accent-source 45% + rgba(0,0,0,0.18), 0 0 16px -4px accent-source 30%`
   - Dark: `0 2px 10px -2px accent-source 50% + rgba(0,0,0,0.30), 0 0 16px -4px accent-source 35%`

**Rule**: Icons use `--accent-source` directly. UI highlights use `--accent-gradient` + `--accent-shadow`. Borders/focus use `--accent-color`. All three harmonize because they derive from the same source.

### 2.4 Global Accent Tinting
All surfaces use `color-mix(in srgb, var(--accent-color) N%, base)`. The entire OS shifts color when the accent changes. Glass surfaces pick up the tint through backdrop-filter blur over the wallpaper.

---

## 3. Glass Treatment

ALL floating UI elements use the SAME frosted glass. No element should be more opaque or blurry than another.

### PERFORMANCE RULE
- **DO NOT go heavy on glass/blur** — performance drops significantly with excessive `backdrop-filter: blur()`
- Only apply `backdrop-filter` on **major containers**: windows, dock, panel, sidebars, dialogs
- **Inner cards/buttons/inputs inside an already-blurred container should NOT have their own blur** — use `background` only (via `glassCard`, `glassButton`, `glassInput`)
- Never nest multiple blur layers — one blur per visual surface is enough
- Prefer `background: var(--bg-glass)` with NO blur for elements inside blurred containers

### 3.1 Glass Tokens
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg-glass` | `rgba(255,255,255,0.78)` | `rgba(12,16,28,0.80)` | Primary glass bg |
| `--bg-glass-hover` | `rgba(255,255,255,0.88)` | `rgba(18,22,36,0.86)` | Hover state |
| `--bg-glass-active` | `rgba(255,255,255,0.94)` | `rgba(26,30,48,0.92)` | Pressed/active state |
| `--glass-border` | accent-tinted `rgba(120,140,200,0.18)` | accent-tinted `rgba(100,120,180,0.16)` | Panel borders |
| `--glass-border-subtle` | accent-tinted `rgba(120,140,200,0.10)` | accent-tinted `rgba(100,120,180,0.08)` | Inner borders |
| `--glass-blur` | `20px` | `20px` | Standard blur |
| `--glass-blur-heavy` | `48px` | `56px` | Major container blur |
| `--glass-shadow` | `0 8px 32px rgba(80,100,160,0.10)` | `0 8px 32px rgba(0,0,0,0.25)` | Panel shadow |

### 3.2 Shared Style Objects (from `useClayStyles.ts`)

Import these instead of writing inline styles:

```ts
import { glassPanel, glassPill, glassCard, glassCardActive, glassButton, insetWell, glassSidebar, glassInput, clayClasses } from '../hooks/useClayStyles';
```

| Style Object | Purpose | Background | Blur | Border | Shadow |
|-------------|---------|------------|------|--------|--------|
| `glassPanel` | Major containers (dock, panels, dialogs) | `--bg-glass` | `--glass-blur` | `--glass-border` | `--glass-shadow` |
| `glassPill` | Pill-shaped elements (alias for glassPanel) | same | same | same | same |
| `glassCard` | Inner cards within blurred containers | `--bg-glass` | none | `--glass-border` | `--shadow-xs` |
| `glassCardActive(color)` | Active cards with color tint | pastel color mix | none | color border | color glow |
| `glassButton` | Clickable button elements | `--bg-glass` | none | `--glass-border` | `--shadow-xs` |
| `insetWell` | Recessed areas (inactive icons, input bg) | `--bg-glass-active` | none | none | `--shadow-inset` |
| `glassSidebar` | Sidebar backgrounds | `--bg-glass` | none | right border | none |
| `glassInput` | Text inputs, search bars | `--bg-glass-active` | none | `--glass-border` | `--shadow-inset` |

### 3.3 CSS Glass Utility Classes

```css
.neo-glass { /* Full glass with blur — use on containers */ }
.neo-card  { /* Glass card without blur — use inside containers */ }
```

---

## 4. Layout — Bottom Area

The bottom is NOT one unified bar. It is independent floating glass pills, vertically centered with the tallest element (center dock).

### 4.1 Vertical Alignment
- **Center dock**: `fixed bottom-2` (8px), height 56px → center at 36px from screen bottom
- **Left/right pills**: `fixed bottom-[14px]` (14px), height 44px → center at 36px (aligned with dock center)
- **Window bottom boundary**: 72px from screen bottom (dock top + 8px gap = same spacing as dock-to-screen)

### 4.2 Left Pills — App Launcher + Ask Genie
- **Position**: `fixed bottom-[14px] left-3`, `flex items-center gap-2`
- **App Launcher**: `rounded-full`, height 44px, `px-3`, 2×2 grid SVG icon
  - Click → toggles Launchpad
- **Ask Genie**: `rounded-full`, height 44px, `px-4`
  - Contents: 4-point star icon (accent) + "Ask Genie" (14px) + microphone icon (16px)
  - Click → toggles Genie search

### 4.3 Center Pill — App Dock
- **Position**: `fixed bottom-2`, horizontally centered
- **Shape**: `rounded-[16px]`, height 56px, padding `0 8px`
- **Contents**: Row of app icons (42px base, 6px gap) — no grid button, no dividers
- **Behavior**: Icons magnify on hover (1.45× + lift), neighbors decay (1.25×, 1.1×)
- **Active indicator**: Small dot(s) below icon, accent color when app is focused

### 4.4 Right Pills — Status Tray (3 Sections)
- **Position**: `fixed bottom-[14px] right-3`, `flex items-center gap-1`
- **All sections**: `rounded-[14px]`, height 44px

| Section | Contents | Click Action |
|---------|----------|-------------|
| Status Icons | WiFi + volume + display (15px each), `px-3` | Opens Control Center |
| Date | Formatted date (13px medium), `px-3` | Toggles Notifications |
| Time + Badge | Time (13px bold) + notification badge (22px accent circle), `px-3` | Toggles Notifications |

---

## 5. Top Menu Bar (Panel)

- **Position**: `fixed top-0`, horizontally centered, `mt-[4px]`
- **Shape**: Glass pill, `rounded-[16px]`, height 38px
- **Contents**: Logo (system menu) + active app name (bold, 13px) + app menus (13px medium)
- **Style**: SAME glass as dock/windows
- **Visible by default** (autohide optional)

---

## 6. Windows

### 6.1 Window Frame
- Frosted glass background (`--bg-glass`, blur `--glass-blur` 24px — NOT heavy blur for performance)
- Rounded corners: `rounded-[20px]`
- Border: `1px solid var(--glass-border)`
- Active window: prominent shadow (`--shadow-xl`) + accent-tinted border glow
- Inactive window: `opacity-[0.92]` + lighter shadow

### 6.2 Title Bar (44px) — CENTERED APP NAME
- **Left**: empty spacer (balances the right controls)
- **CENTER**: App name (semibold, 13px) — `absolute left-1/2 -translate-x-1/2` for true centering
- **Right**: minimize (−), maximize (□), close (×) — icon buttons, 28×28px, `rounded-[8px]`
  - Close: `hover:bg-pastel-red/20 hover:text-pastel-red`
  - Others: `hover:bg-[--bg-glass-hover]`
- Background: transparent (inherits window glass)
- Bottom separator: `1px solid var(--border-subtle)`
- **CRITICAL**: App name MUST be centered in the title bar, not left-aligned

### 6.3 Content Area Background — Accent Tinted
- Content areas use `bg-[--bg-base]` which has a **visible accent tint** (10% in light, 7% in dark)
- The entire OS shifts color when the accent changes — every surface picks up the tint
- Glass surfaces (`--bg-glass`) also have accent tinting (8% light, 6% dark)
- Do NOT use `bg-transparent` for content areas — they need the accent-tinted background
- Do NOT use hardcoded grays — always use `--bg-base`, `--bg-surface`, `--bg-overlay` which all carry the accent tint

### 6.4 Classic Mode Title Bar (48px)
- macOS colored traffic light dots (close=red, minimize=yellow, maximize=green) + app name
- Standard macOS window chrome

---

## 7. Sidebar Pattern

Used by Explorer, Settings, Notes, Mail, Contacts, Music, ApiDocs, AppStore, Reminders, etc.
**ALL apps with sidebars MUST use the shared `<Sidebar>` component from `components/ui/Sidebar.tsx`.**

- **Width**: 230px (clay), 200px (classic); overlay variant: 250px/220px
- **Background**: `glassSidebar` style object → `var(--bg-glass)` + heavy blur + right border
- **Header**: App-specific content, bold 14px
- **Section groups**: Optional uppercase headers (11px, muted, bold, wide tracking)
- **Items** (clay mode — GNOME-like generous sizing):
  - Height: `py-2.5`, `gap-3` between icon and label
  - **Active: `background: var(--accent-gradient)` + `box-shadow: var(--accent-shadow)`** — GRADIENT, not flat color
  - Active text: `text-white`
  - Active implementation: `style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}`
  - Inactive hover: `hover:bg-[--bg-glass-hover]`
  - Press: `active:scale-[0.98]`
  - Border radius: `rounded-[12px]`
- **Item icons**: `w-6 h-6 rounded-[7px]` (clay), `w-5 h-5` (classic), colored bg, 14px white icon
  - When active: `bg-white/25` (semi-transparent white over gradient)
- **Item text**: `text-[14px] font-medium` (clay), `text-[13px]` (classic)

---

## 8. App Icons (TintedAppIcon)

### 8.1 Clay Mode — Monochrome Accent-Tinted (Theme-Aware)

All icons use `--accent-source` (raw user color) in `color-mix` gradients. Light theme = lower percentages (lighter/washed), dark theme = higher percentages (darker/saturated).

**Light theme gradients:**
| Shade | From | To |
|-------|------|----|
| 0 | `accent-source 48% + pastel-blue` | `accent-source 30% + pastel-lavender` |
| 1 | `accent-source 38% + pastel-lavender` | `accent-source 55% + pastel-blue` |
| 2 | `accent-source 56% + pastel-mauve` | `accent-source 38% + pastel-blue` |

**Dark theme gradients:**
| Shade | From | To |
|-------|------|----|
| 0 | `accent-source 72% + pastel-blue` | `accent-source 55% + pastel-lavender` |
| 1 | `accent-source 62% + pastel-lavender` | `accent-source 80% + pastel-blue` |
| 2 | `accent-source 82% + pastel-mauve` | `accent-source 65% + pastel-blue` |

- **Gradient direction**: `linear-gradient(135deg, from, to)`
- **Icon glyph**: White Lucide icon, `drop-shadow-sm`, 50% of container size
- **Highlight overlay**: `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%)`
- **Shadow**: `0 2px 8px color-mix(in srgb, var(--accent-source) 25%, rgba(0,0,0,0.15))`
- **Border radius**: `size × 0.22`
- **Critical**: Uses `--accent-source` (NOT `--accent-color`) to prevent double-mixing

### 8.2 Classic Mode
Each app has individual pastel background color (blue, green, red, yellow, etc.) from `appIconMap`.

---

## 9. Component Pattern Reference

### 9.1 Cards
- **Glass card**: `glassCard` style + `rounded-[16px]`
- **Active card**: `glassCardActive('blue')` + `rounded-[16px]`
- **Content padding**: `p-3` to `p-4`
- **Title**: 13px semibold
- **Subtitle/body**: 12px regular, `text-[--text-muted]`

### 9.2 Buttons
- **Primary**: `bg-accent` class → gets gradient + shadow automatically
- **Secondary**: `glassButton` style + `rounded-[12px]`
- **Ghost**: `bg-transparent hover:bg-[--bg-glass-hover]`
- **Danger**: `bg-pastel-red/15 text-pastel-red hover:bg-pastel-red/25`
- **All buttons**: `active:scale-[0.97]` press feedback
- **Padding**: `px-3 py-1.5` (small), `px-4 py-2` (medium)

### 9.3 Inputs
- **Text input**: `glassInput` style OR global CSS override (automatic in clay mode)
- **Border radius**: `rounded-[16px]` (var(--radius-md))
- **Focus**: `border-color: var(--accent-color)` + `box-shadow: 0 0 0 3px accent 20%`
- **Search bar**: Same as input, often with icon prefix, `rounded-full` for capsule shape

### 9.4 Toggles / Switches
- **Inactive**: `bg-[--bg-overlay]`, `rounded-full`
- **Active**: `--accent-gradient` background + `--accent-shadow` glow
- **Transition**: `background 0.3s ease, box-shadow 0.3s ease`

### 9.5 Lists / Table Rows
- **Container**: No border, transparent bg
- **Row hover**: `bg-[--bg-glass-hover]`, `rounded-[10px]`
- **Row active**: `bg-accent` (gradient)
- **Separator**: `border-[--glass-border]` or `border-[--border-subtle]`
- **Alternating**: Don't use zebra stripes. Use transparent + subtle hover.

### 9.6 Tabs
- **Tab bar**: `bg-[--bg-overlay]` or transparent, `rounded-[12px]` container
- **Active tab**: `bg-accent` or `bg-[--bg-glass-active]` + accent bottom border
- **Inactive tab**: transparent, `text-[--text-muted]`
- **Transition**: smooth bg transition

### 9.7 Modals / Dialogs
- Glass panel backdrop: `bg-black/30 backdrop-blur-sm`
- Dialog: `glassPanel` style + `rounded-[28px]` + `shadow-xl`
- Content padding: `p-5` to `p-6`
- Buttons: right-aligned, primary action uses `bg-accent`

### 9.8 Scrollbars
- Thin (6px), rounded, auto-hide
- Track: transparent
- Thumb: `--bg-glass-active` / accent-tinted on hover

---

## 10. Control Center

- Opens from bottom-right, anchored above status tray pill
- Glass panel, `rounded-[20px]`, width ~340px
- Same glass treatment as everything else

### Layout (top to bottom):
1. **User row**: Avatar circle + name + "Logout" pill button (outline) + power circle button
2. **Connectivity** (2-col grid): Internet card (active=blue, wifi icon + SSID) | Bluetooth card
3. **Quick toggles** (3-col): Fullscreen | Dark Mode | Night Shift
4. **Now Playing + Brightness** (3/5 + 2/5 split): Playing card | Brightness controls
5. **Volume + Battery** (2-col): Volume slider card | Battery % + wave visual
6. **Bottom row**: Full-width "Customize" card with gear icon

---

## 11. Notification Center

- Opens from right side (click date/time in status tray)
- Glass panel, slides in from right
- Notification cards: `glassCard` style, `rounded-[16px]`
- Dismiss: swipe right or click X
- Clear all: link button at top
- Empty state: centered icon + "No notifications" text

---

## 12. Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` / `rounded-[12px]` | 12px | Buttons, inputs, small cards, sidebar items |
| `--radius-md` / `rounded-[16px]` | 16px | Medium cards, search pills, tabs |
| `--radius-lg` / `rounded-[22px]` | 22px | Large cards, dock pill |
| `--radius-xl` / `rounded-[28px]` | 28px | Windows, panels, control center, modals |
| `--radius-2xl` / `rounded-[34px]` | 34px | Large modals |
| `--radius-full` / `rounded-full` | 9999px | Capsule pills, circles, toggles, avatars |

**General rule**: The larger the container, the larger the radius.

---

## 13. Shadow Scale

All cool-toned, soft, and diffused — no harsh black drops:

| Token | Light | Dark |
|-------|-------|------|
| `--shadow-xs` | `0 1px 3px rgba(80,100,160,0.05)` | `0 1px 3px rgba(0,0,0,0.12)` |
| `--shadow-sm` | `0 2px 8px rgba(80,100,160,0.06)` | `0 2px 8px rgba(0,0,0,0.16)` |
| `--shadow-md` | `0 4px 16px rgba(80,100,160,0.08)` | `0 4px 16px rgba(0,0,0,0.20)` |
| `--shadow-lg` | `0 8px 32px rgba(80,100,160,0.10)` | `0 8px 32px rgba(0,0,0,0.25)` |
| `--shadow-xl` | `0 16px 48px rgba(80,100,160,0.12)` | `0 16px 48px rgba(0,0,0,0.30)` |
| `--shadow-inset` | `inset 0 1px 3px rgba(80,100,160,0.06)` | `inset 0 1px 3px rgba(0,0,0,0.12)` |
| `--shadow-pressed` | `inset 0 2px 6px rgba(80,100,160,0.10)` | `inset 0 2px 6px rgba(0,0,0,0.20)` |

---

## 14. Typography

- **Font**: System UI / "SF Pro" family — `font-family: 'SF Pro', -apple-system, system-ui, sans-serif`
- **NO monospace in clay mode** (clay overrides `font-mono` on `.clay .window`)
- **Color**: `--text-color` for primary, `--text-muted` for secondary
- **No pure black or pure white text** — always use tokens

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| App name in title bar | 13px | 600 (semibold) | |
| Sidebar section headers | 11px | 700 (bold) | Uppercase, wide tracking |
| Sidebar items | 13px | 500 (medium) | |
| Panel menus | 13px | 500 (medium) | |
| Card titles | 13px | 600 (semibold) | |
| Card body | 12px | 400 (regular) | `text-[--text-muted]` |
| Small labels | 10-11px | 500 (medium) | Status indicators, badges |
| Buttons | 13px | 500-600 | |
| Headings (in-app) | 16-18px | 600-700 | Rare, only main headings |

---

## 15. Interactions & Animation

### 15.1 Hover
- Subtle background change: transparent → `--bg-glass-hover`
- Cards: subtle shadow increase
- No color/transform changes on hover (too distracting)

### 15.2 Press
- `active:scale-[0.97]` — springy feel
- Use `clayClasses.interactivePress` for convenience

### 15.3 Transitions
- **CSS transitions**: `transition-all duration-200` for most elements
- **Framer Motion springs**: `type: 'spring', stiffness: 400, damping: 25` for major animations
- **Dock magnification**: `stiffness: 150, damping: 20, mass: 1`
- **Panel/sheet slides**: `stiffness: 300, damping: 28`

### 15.4 Glass Hover States
| State | Background |
|-------|-----------|
| Default | `--bg-glass` or transparent |
| Hover | `--bg-glass-hover` |
| Active/Pressed | `--bg-glass-active` |

### 15.5 Toggle/Active States
- Active toggles: `--accent-gradient` bg + `--accent-shadow`
- Active sidebar items: `bg-accent` class (auto-gradient in clay)
- Active dots: `bg-accent`
- Active connectivity cards: `glassCardActive('blue')` / `glassCardActive('green')`

---

## 16. Layout & Spacing Philosophy

Clay mode follows a **centered, breathable, GNOME-like** layout. Content should never stretch edge-to-edge. Elements should feel generously spaced and vertically comfortable — never cramped or flattened.

### 16.1 Content Area Layout (Settings Panes, Detail Views)
- **Max width**: `max-w-[640px] mx-auto` for all settings/detail content panes
- **Padding**: `p-8 pt-10` on desktop, `p-4` on mobile
- **Page heading**: Icon (24-28px) + title (20-24px semibold) + optional subtitle (13px muted), `mb-6`
- **Section headers**: `text-[11px] uppercase font-bold text-[--text-muted] tracking-wide pl-3 mb-2 mt-6`
- **Section groups**: `glassCard` style + `rounded-[16px]` + `overflow-hidden mb-6`
- **Row height**: min `py-3` (desktop), `py-3.5` (mobile) — NEVER flattened `py-1.5`
- **Row separator**: `border-b border-[--text-muted]/10` in clay, `border-b border-[--border-color]` in classic
- **Row padding**: `px-4` minimum

### 16.2 Buttons — CRITICAL Rules
- **NEVER use `w-full` buttons** in settings/detail panes in clay mode — they look flattened and oversized
- **Primary action buttons**: `px-5 py-2.5 rounded-[12px] text-[13px] font-medium` — compact, pill-like
- **Place buttons**: Inline within a row, or centered below content — NOT stretching across the full card width
- **Accent buttons**: Use inline `style={{ background: 'var(--accent-color)' }}` + `text-white` (NOT `bg-accent/80` — Tailwind opacity modifiers don't work on CSS variables)
- **Secondary/ghost buttons**: `glassButton` style + `rounded-[12px]`
- **Destructive buttons**: `bg-[--pastel-red] text-white rounded-[12px] px-5 py-2.5`
- **Button grouping**: When multiple buttons, use `flex items-center gap-3` — horizontally, not stacked

### 16.3 CRITICAL: `bg-accent/` Opacity Bug
Tailwind's opacity modifier syntax (`bg-accent/80`, `bg-accent/10`, etc.) does NOT work because `accent` is defined as `var(--accent-color)` — a raw CSS variable, not rgb format. All `bg-accent/XX` patterns silently produce no background.

**Fix patterns:**
- `bg-accent/10` → `bg-[--bg-glass-hover]` or use inline `style={{ background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' }}`
- `bg-accent/80` hover → use inline `style={{ background: 'var(--accent-color)', opacity: 0.8 }}` or just `hover:opacity-80`
- `bg-accent` for active state → use inline `style={{ background: 'var(--accent-color)' }}` with `text-white`
- For selected items/highlights → inline style with `var(--accent-color)` + `text-white`
- For subtle tints → `bg-[--bg-glass-hover]` or `bg-[--bg-glass-active]`

### 16.4 Sidebar Layout (Shared Sidebar Component)
ALL apps with sidebars MUST use the shared `<Sidebar>` component from `components/ui/Sidebar.tsx`.

- **Width**: 230px (clay), 200px (classic)
- **Item height**: `py-2.5` (clay), `py-1.5` (classic) — generous touch targets
- **Icon badges**: `w-6 h-6 rounded-[7px]` (clay), `w-5 h-5` (classic)
- **Icon size**: 14px (clay), 12px (classic)
- **Text**: `text-[14px]` (clay), `text-[13px]` (classic)
- **Active item**: `style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}` + `text-white` — **GRADIENT, not flat**
- **Inactive hover**: `hover:bg-[--bg-glass-hover]`
- **Press feedback**: `active:scale-[0.98]`
- **Rounded**: `rounded-[12px]` on items

### 16.5 App Content Centering
- **Sidebar + content split**: Sidebar on left, content takes `flex-1`
- **Content scroll**: `flex-1 h-full overflow-y-auto`
- **Inner content**: `max-w-[640px] mx-auto` for settings-like panes
- **For wider content** (tables, grids, file browsers): `max-w-[960px] mx-auto` or no max-width
- **Empty states**: Always centered both axes, icon + text + optional action button

### 16.6 Cards & Groups (Settings Pattern)
```
SettingsGroup = glass card container, rounded-[16px], overflow-hidden, mb-6
  SettingsRow  = px-4 py-3, flex justify-between, border-b on non-last
    Label      = text-[13px] font-medium text-[--text-color]
    Value      = text-[13px] text-[--text-muted] (or toggle/button)
```
- Buttons inside cards: right-aligned or inline, NOT full-width
- Toggles: right-aligned within row
- Dropdowns/selects: right-aligned, `rounded-[10px]` with `glassInput` style

### 16.7 Toolbar Pattern
- **Height**: `h-[40px]` (clay), `h-[34px]` (classic)
- **Background**: transparent (inherits from window glass)
- **Bottom border**: `border-b border-[--glass-border]` (clay) or `border-b border-[--border-color]` (classic)
- **Padding**: `px-3`
- **Tool buttons**: `p-1.5 rounded-[8px] hover:bg-[--bg-glass-hover]`
- **Text**: `text-[13px] text-[--text-color]`
- **Search bars**: `rounded-full` capsule, `glassInput` style, `h-[32px] px-3`

### 16.8 Empty States
- Center vertically and horizontally in available space
- Icon: 48px, `text-[--text-muted]`, `mb-4`
- Heading: `text-lg font-semibold text-[--text-color]`
- Description: `text-[13px] text-[--text-muted] max-w-[300px] text-center`
- Action button (optional): centered, primary accent style, NOT full-width

### 16.9 Info/Warning Banners
- Use `glassCard` style + `rounded-[12px]` — NOT colored backgrounds that clash with theme
- Text: `text-[13px] text-[--text-muted]` — NOT low-contrast pastel colors
- Icon: Use `text-[--text-muted]` info icon, not colored warning icons
- Example: "Wi-Fi controls require native mode" → `glassCard` + `text-[--text-muted]` + info icon
- **NEVER** use `text-pastel-yellow` on light backgrounds — invisible!
- In clay: all info banners should be subtle glass cards with muted text

---

## 17. Per-App Overhaul Checklist

When overhauling an app for clay mode, follow this checklist:

### Before Starting
1. Add `const clay = useIsClay();` if not present
2. Import shared styles: `import { glassCard, glassButton, glassInput, glassSidebar, clayClasses } from '../hooks/useClayStyles';`
3. Import clay hook: `import { useIsClay } from '../hooks/useIsClay';`
4. Identify all hardcoded colors, borders, shadows, border-radii
5. **Check for `bg-accent/` patterns — these are ALL broken and must be fixed**

### Universal Changes (apply to every app)
- [ ] Replace `bg-surface` / `bg-overlay` with glass or transparent (inside window, the glass is already there)
- [ ] Replace hardcoded `text-white` / `text-black` with `text-[--text-color]` / `text-[--bg-base]`
- [ ] Replace hardcoded border colors with `border-[--glass-border]` or `border-[--border-subtle]`
- [ ] Replace hardcoded shadows with `var(--shadow-sm)` / `var(--shadow-md)` etc.
- [ ] Add `rounded-[12px]` to `rounded-[16px]` on cards, buttons, containers
- [ ] Add `active:scale-[0.97]` on clickable elements
- [ ] Replace inline styles with shared utility objects where possible
- [ ] Ensure no `font-mono` leaks into body text (OK for code editors / terminals)
- [ ] Use `text-[--text-muted]` for secondary labels, not `opacity-50` or `text-gray-*`
- [ ] Fix ALL `bg-accent/XX` patterns → use inline styles or glass tokens instead
- [ ] Buttons: NEVER `w-full` in clay mode settings/detail panes; use `px-5 py-2.5 rounded-[12px]`
- [ ] Content centering: `max-w-[640px] mx-auto` for settings-like panes
- [ ] Generous vertical spacing: `py-3` min on rows, `mb-6` between groups, `mt-6` on section headers
- [ ] Use `border-[--text-muted]/10` for separators in clay (subtle, not harsh)

### Sidebar Apps (Explorer, Settings, Notes, Mail, Contacts, Music, ApiDocs, AppStore, Reminders, etc.)
- [ ] **MUST** use shared `<Sidebar>` component — no inline sidebar implementations
- [ ] Pass `items` prop with proper `{ title?, items: { name, icon, path, color? }[] }[]` format
- [ ] Use `glassSidebar` for sidebar background (blur only on sidebar, not inner elements)
- [ ] Active items: `style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}` + `text-white` — **GRADIENT**
- [ ] Section headers: 11px, bold, uppercase, wide tracking, muted
- [ ] Item sizing: py-2.5, w-6 h-6 icon badges, text-[14px] in clay

### Content Area
- [ ] Cards: `glassCard` style + `rounded-[16px]`
- [ ] Inputs: rely on global CSS override OR use `glassInput`
- [ ] Buttons: `glassButton` or accent style for primary, NEVER `w-full` on desktop
- [ ] Toolbars: transparent bg, `border-b border-[--glass-border]`
- [ ] Empty states: centered, muted text, optional icon (see 16.8)

### Mobile Variants
- [ ] Same glass treatment, adjusted sizing
- [ ] Full-width cards, reduced padding
- [ ] Bottom sheet modals instead of centered dialogs
- [ ] Touch-friendly hit targets (min 44px)
- [ ] `w-full` buttons are OK on mobile (narrow screens)
- [ ] `font-sans` always (no font-mono in clay)

---

## 17. Size Reference

| Element | Clay | Classic |
|---------|------|---------|
| Left pill height | 44px | — |
| Center dock height | 56px | 67px |
| Right pill height | 44px | — |
| Dock icon base size | 42px | 50px |
| Dock icon gap | 6px | 10px |
| Panel height | 38px | 34px |
| Panel border-radius | 16px | 14px |
| Window title bar | 44px | 48px |
| Window border-radius | 20px | 0px |
| Sidebar width | 220px | 200px |
| Sidebar overlay width | 240px | 220px |
| Window bottom boundary | 72px from screen | 54px from screen |

---

## 18. Do's and Don'ts

### DO
- Use CSS tokens for ALL colors — no hardcoded hex values in clay mode
- Use shared style objects from `useClayStyles.ts`
- Use `bg-accent` class for accent highlights (CSS handles gradient + shadow)
- Use `--accent-source` in icon gradients (not `--accent-color`)
- Use `var(--accent-gradient)` + `var(--accent-shadow)` for sidebar active items
- Center app name in window title bars
- Use `bg-[--bg-base]` for content areas — it carries visible accent tinting
- Use `rounded-[12px]` minimum on ALL interactive elements in clay
- Use `rounded-[16px]` on cards and groups
- Test both light AND dark themes after every change
- Verify classic mode still works after adding clay conditionals
- Keep generous spacing — GNOME-like breathable layouts

### DON'T
- **Don't use `bg-accent/XX` (Tailwind opacity modifier)** — it's broken with CSS variable colors. Use inline styles instead.
- Don't use `opacity-50` for muted text — use `text-[--text-muted]`
- Don't hardcode `#fff` / `#000` — use `--text-color` / `--bg-base`
- Don't use `w-full` buttons in settings/detail panes — use compact `px-5 py-2.5` pill buttons
- Don't use `font-mono` for non-code text in clay mode
- Don't add extra borders/dividers that aren't `--glass-border` or `--border-subtle`
- Don't use Tailwind's built-in gray/slate/zinc colors — use design tokens
- **Don't nest glass panels with blur — PERFORMANCE KILLER**. Only blur on major containers.
- Don't leave flat/square corners — everything in clay should have `rounded-[12px]` minimum
- Don't use `bg-transparent` for content areas — use `bg-[--bg-base]` which carries accent tint
- Don't use warning/info banners with low-contrast colors (e.g., yellow text on light bg)
- Don't place app name on left side of titlebar — it MUST be centered

---

## 19. Settings

- **Panel autohide**: OFF by default. When ON, hides on idle, shows on hover near top.
- **Dock autohide**: OFF by default. When ON, hides on idle, shows on hover near bottom.
- Both are independent toggles in Settings → Appearance.
- **Style switcher**: Toggle between "Clay" and "Classic" in Settings → Appearance. Persists via localStorage, reloads page.
- **Accent color**: Color picker in Settings → Appearance. Sets `--accent-source`, everything else derives automatically.
