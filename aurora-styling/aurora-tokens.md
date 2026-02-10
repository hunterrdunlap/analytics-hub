# Aurora Design Tokens

This document defines the Aurora design system tokens used throughout the dashboard.

## Color Palette

### Primary Colors

| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| Primary Green | `--primary` | #11891C | Main brand color, active states |
| Soft Green | `--primary-soft` | #70BA44 | Secondary accents |
| Bright Green | `--primary-bright` | #AED136 | Highlights, gradients |
| Teal | `--teal` | #018181 | Alternative primary |
| Soft Teal | `--teal-soft` | #6FC6A5 | Backgrounds, fills |
| Cyan | `--cyan` | #11AECF | Accents, secondary lines |
| Blue | `--blue` | #0E729A | Chart gradients, links |
| Purple | `--purple` | #6867AF | Tertiary accent |

### Semantic Colors

| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| Danger | `--danger` | #ef4444 | Errors, negative trends |
| Danger Soft | - | #f87171 | Light danger backgrounds |
| Warning | - | #f59e0b | Caution, moderate values |

### Neutral Colors

| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| Background Base | `--bg-base` | #f8fafc | Page background |
| Background White | `--bg-white` | #ffffff | Card backgrounds |
| Text Dark | `--text-dark` | #0f172a | Headings |
| Text Main | `--text-main` | #334155 | Body text |
| Text Muted | `--text-muted` | #64748b | Secondary text |

---

## Typography

### Font Family

```css
font-family: "Outfit", system-ui, sans-serif;
```

Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### Font Weights

| Weight | Name | Usage |
|--------|------|-------|
| 300 | Light | Subtle labels |
| 400 | Regular | Body text |
| 500 | Medium | Nav links, buttons |
| 600 | Semibold | Card titles, labels |
| 700 | Bold | Headings, KPI values |
| 800 | Extra Bold | Logo mark |

### Font Sizes

| Element | Size | Line Height |
|---------|------|-------------|
| Page title | 24px | 1.3 |
| Topbar title | 26px | 1.3 |
| Chart title | 16px | 1.4 |
| KPI value | 28px | 1.2 |
| Body text | 14px | 1.5 |
| Labels | 11-12px | 1.4 |
| Chips/pills | 9-10px | 1.3 |

---

## Spacing

### Base Unit

8px grid system

### Common Spacing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Chip padding |
| md | 12-16px | Card padding |
| lg | 20-24px | Section gaps |
| xl | 28-32px | Page margins |

### Layout Spacing

| Element | Padding/Gap |
|---------|-------------|
| Sidebar | 28px 22px |
| Topbar | 22px 36px |
| Content | 32px 36px 48px |
| Card | 22-24px |
| KPI grid gap | 20px |
| Chart grid gap | 20px |

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
```

### Usage

| Shadow | When |
|--------|------|
| sm | Chips, small elements |
| md | Cards default state |
| lg | Cards on hover, modals |

---

## Border Radius

| Element | Radius |
|---------|--------|
| Logo mark | 14px |
| Cards | 18px |
| Nav links | 12px |
| Chips/pills | 10px / 999px |
| Chart containers | 8px |

---

## Animations

### Timing Functions

```css
/* Standard easing */
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

/* Smooth hover */
transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
```

### Durations

| Animation | Duration |
|-----------|----------|
| Hover transitions | 0.25-0.35s |
| Page fade-in | 0.3s |
| Aurora rotate | 40s |
| Float shapes | 25-35s |
| Gradient slide | 10s |

### Keyframe Animations

**Aurora Rotate:**
```css
@keyframes auroraRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**Float (shapes):**
```css
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-30px, 40px) scale(0.95); }
  66% { transform: translate(20px, -20px) scale(1.02); }
}
```

**Gradient Slide (topbar):**
```css
@keyframes gradientSlide {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
```

**Page Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Loading Spinner:**
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Glassmorphism

### Sidebar/Topbar

```css
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(24px) saturate(180%);
-webkit-backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(17, 137, 28, 0.08);
```

---

## Gradient Border Hover

Cards use a mask technique for gradient border on hover:

```css
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 18px;
  padding: 2px;
  background: linear-gradient(135deg, var(--primary), var(--cyan), var(--primary-soft));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.card:hover::before {
  opacity: 1;
}
```

---

## Card Lift Effect

```css
.card {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);  /* KPI cards */
  /* or */
  transform: translateY(-2px);  /* Chart cards */
  box-shadow: var(--shadow-lg);
}
```

---

## Chart Colors (Plotly)

### Color Sequence

```javascript
const chartColors = [
  '#11891C',  // Primary green
  '#11AECF',  // Cyan
  '#018181',  // Teal
  '#70BA44',  // Soft green
  '#6867AF',  // Purple
  '#0E729A',  // Blue
  '#6FC6A5',  // Teal soft
  '#AED136'   // Bright green
]
```

### Transparent Backgrounds

```javascript
plot_bgcolor: 'rgba(0,0,0,0)',
paper_bgcolor: 'rgba(0,0,0,0)'
```

### Grid Lines

```javascript
gridcolor: 'rgba(17,137,28,0.06)',
zerolinecolor: 'rgba(17,137,28,0.15)'
```

### Hover Label

Dark glassmorphic style for contrast against light cards:

```javascript
hoverlabel: {
  bgcolor: 'rgba(15, 23, 42, 0.92)',   // Dark slate, slightly transparent
  bordercolor: '#11891C',               // Primary green accent
  font: {
    color: '#f8fafc',
    size: 12,
    family: '"Outfit", system-ui, sans-serif'
  },
  align: 'left',
  namelength: -1                        // Show full series names
}
```

### Spike Lines (Time-Series)

Subtle vertical reference from hover point to x-axis:

```javascript
// Applied to xaxis when showSpikes: true
showspikes: true,
spikemode: 'across',
spikesnap: 'cursor',
spikecolor: 'rgba(17, 137, 28, 0.3)',  // Subtle green
spikethickness: 1,
spikedash: 'dot'
```

### Hover Modes

```javascript
// Single series
hovermode: 'closest'

// Multi-series (shows all values at same x-position)
hovermode: 'x unified'
```

---

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Desktop | > 1100px | Full layout |
| Tablet | 820-1100px | 2-col KPIs, stacked charts |
| Mobile | < 820px | Sidebar collapses, 1-col |
| Small | < 480px | 1-col KPIs, stacked topbar |

```css
@media (max-width: 1100px) { ... }
@media (max-width: 820px) { ... }
@media (max-width: 480px) { ... }
```
