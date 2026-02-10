# Aurora Design System

Glassmorphic styling with animated gradients for consistent page design.

## Quick Start

1. Add the Google Font in your `<head>`:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
   ```

2. Include the stylesheet:
   ```html
   <link rel="stylesheet" href="aurora.css">
   ```

## Key CSS Classes

| Class | Usage |
|-------|-------|
| `.app-shell` | Main page wrapper (grid layout) |
| `.aurora-bg` | Animated gradient background |
| `.sidebar` | Glassmorphic navigation |
| `.topbar` | Header with gradient accent |
| `.content` | Main content area |
| `.kpi-card` | Metric/info card with hover effect |
| `.chart-card` | Container card for content |

## Basic Page Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Page Title</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="aurora.css">
</head>
<body>
  <!-- Aurora Background (at root level, sibling to app-shell) -->
  <div class="aurora-bg"></div>
  <div class="shape shape-1"></div>
  <div class="shape shape-2"></div>
  <div class="shape shape-3"></div>

  <!-- App Shell (sibling to background) -->
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo-block">
        <img src="assets/nelnet-logo.svg" alt="Logo" class="logo-image">
        <div class="logo-subtitle">Your App Name</div>
      </div>

      <div class="nav-list">
        <a href="#" class="nav-link active">
          <span>Dashboard</span>
          <span class="pill">KPIs</span>
        </a>
        <a href="#" class="nav-link">
          <span>Reports</span>
        </a>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <h1 class="topbar-title">Page Title</h1>
      </header>

      <section class="content">
        <!-- Your content here -->
      </section>
    </main>
  </div>
</body>
</html>
```

**Important:** The aurora background and shapes must be siblings of `.app-shell`, not children. This allows the glassmorphic blur effects to work properly.

## Color Variables

Use these CSS custom properties for consistent theming:

| Variable | Color | Usage |
|----------|-------|-------|
| `--aurora-green` | `#4ade80` | Primary green |
| `--aurora-teal` | `#2dd4bf` | Teal accent |
| `--aurora-cyan` | `#22d3ee` | Cyan accent |
| `--aurora-blue` | `#60a5fa` | Blue accent |
| `--aurora-indigo` | `#818cf8` | Indigo accent |
| `--aurora-purple` | `#a78bfa` | Purple accent |
| `--aurora-pink` | `#f472b6` | Pink accent |
| `--aurora-magenta` | `#e879f9` | Magenta accent |

### Background & Surface Colors

| Variable | Usage |
|----------|-------|
| `--surface-bg` | Main background |
| `--surface-card` | Card backgrounds |
| `--surface-elevated` | Elevated elements |
| `--glass-bg` | Glassmorphic backgrounds |

### Text Colors

| Variable | Usage |
|----------|-------|
| `--text-primary` | Primary text |
| `--text-secondary` | Secondary/muted text |
| `--text-muted` | Disabled/subtle text |

## Card Examples

### KPI Card
```html
<div class="kpi-card">
  <div class="kpi-label">Total Users</div>
  <div class="kpi-value">1,234</div>
  <div class="kpi-trend trend-up">+12.5%</div>
</div>
```

### Chart Card
```html
<div class="chart-card">
  <div class="chart-header">
    <h3 class="chart-title">Monthly Overview</h3>
  </div>
  <div class="chart-body">
    <!-- Content goes here -->
  </div>
</div>
```

## Responsive Breakpoints

The design system includes 4 responsive breakpoints:

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Desktop | > 1024px | Full sidebar, all features |
| Tablet | 768px - 1024px | Collapsed sidebar |
| Mobile Large | 480px - 768px | Hidden sidebar, stacked layout |
| Mobile | < 480px | Minimal padding, touch-friendly |

## Files Included

```
aurora-styling/
├── README.md           # This file
├── aurora.css          # Main stylesheet (~784 lines)
├── aurora-tokens.md    # Full design reference
├── assets/
│   └── nelnet-logo.svg # Logo for sidebar
└── examples/
    └── basic-page.html # Working example template
```

## Additional Resources

See `aurora-tokens.md` for the complete design system reference including:
- All CSS variables and their values
- Animation keyframes
- Component-specific styling details
- Accessibility considerations
