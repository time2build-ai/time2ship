# Color Rules

## Core Palette

| Name             | Hex       | Tailwind Variable | Usage                                   |
| ---------------- | --------- | ----------------- | --------------------------------------- |
| **Ink**          | `#0a0a0b` | `--ink`           | Primary background (dark)               |
| **Ink Muted**    | `#18181b` | `--ink-muted`     | Card backgrounds, elevated surfaces     |
| **Ink Subtle**   | `#27272a` | `--ink-subtle`    | Borders, dividers, disabled states      |
| **Surface**      | `#fafaf9` | `--surface`       | Primary text on dark, light backgrounds |
| **Surface Warm** | `#f5f5f4` | `--surface-warm`  | Secondary backgrounds                   |
| **Surface Dim**  | `#e7e5e4` | `--surface-dim`   | Muted text, placeholders                |

## Accent Colors

| Name             | Hex                       | Tailwind Variable       | Usage                            |
| ---------------- | ------------------------- | ----------------------- | -------------------------------- |
| **Primary**      | `#2563eb`                 | `--accent-primary`      | CTAs, links, primary actions     |
| **Primary Soft** | `#3b82f6`                 | `--accent-primary-soft` | Hover states, secondary emphasis |
| **Primary Glow** | `rgba(37, 99, 235, 0.15)` | `--accent-glow`         | Focus rings, glows               |
| **Success**      | `#10b981`                 | `--accent-success`      | Success states, confirmations    |
| **Warning**      | `#f59e0b`                 | `--accent-warning`      | Warnings, caution states         |
| **Error**        | `#ef4444`                 | `--accent-error`        | Errors, destructive actions      |

## Color Usage Examples

```jsx
// Primary button
<button className="bg-accent-primary hover:bg-accent-primary-soft text-white">
  Get Started
</button>

// Card on dark background
<div className="bg-ink-muted border border-ink-subtle">
  <h3 className="text-surface">Card Title</h3>
  <p className="text-surface-dim">Card description</p>
</div>

// Status badge
<span className="bg-accent-success text-white">Active</span>
```

## Color Usage Rules

- Use `bg-ink` for main dark backgrounds
- Use `bg-ink-muted` for card backgrounds and elevated surfaces
- Use `border-ink-subtle` for borders and dividers
- Use `text-surface` for primary text on dark backgrounds
- Use `text-surface-dim` for secondary/muted text
- Use `bg-accent-primary` for primary actions and CTAs
- Use `hover:bg-accent-primary-soft` for hover states
- Use `focus:ring-accent-glow` for focus states
- Use semantic colors (success, warning, error) for their respective states
