# Animation Rules

## Easing Functions

| Name          | Value                                 | CSS Variable    | Usage                                 |
| ------------- | ------------------------------------- | --------------- | ------------------------------------- |
| `ease-out`    | `cubic-bezier(0.16, 1, 0.3, 1)`       | `--ease-out`    | Default for most UI transitions       |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)`      | `--ease-in-out` | Looping animations                    |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)`   | `--ease-spring` | Toggles, modals, playful interactions |
| `ease-bounce` | `cubic-bezier(0.68, -0.6, 0.32, 1.6)` | `--ease-bounce` | Delight moments (use sparingly)       |

## Easing Guidelines

- **ease-out**: Snappy start, smooth landing — use for most hover states and transitions
- **ease-in-out**: Smooth start and end — best for looping or reversible animations
- **ease-spring**: Slight overshoot — adds tactile feel to toggles and modals
- **ease-bounce**: Playful bounce — reserve for celebratory or attention-grabbing moments

```jsx
// Default transition
<div className="transition-all duration-normal ease-out">

// Spring animation for toggle
<div className="transition-transform duration-normal ease-spring">
```

## Duration Scale

| Name      | Value | CSS Variable         | Tailwind Class | Usage                         |
| --------- | ----- | -------------------- | -------------- | ----------------------------- |
| `instant` | 100ms | `--duration-instant` | `duration-100` | Micro-feedback, color changes |
| `fast`    | 150ms | `--duration-fast`    | `duration-150` | Hover states, small elements  |
| `normal`  | 250ms | `--duration-normal`  | `duration-250` | Default transitions           |
| `slow`    | 400ms | `--duration-slow`    | `duration-400` | Page transitions, modals      |
| `slower`  | 600ms | `--duration-slower`  | `duration-600` | Orchestrated sequences        |

## Duration Guidelines

- When in doubt, go shorter — UI should feel snappy
- 150-250ms covers most interaction cases
- Reserve 400ms+ for important transitions (modals, page changes)
- Stagger delays should be 50-100ms per item

```jsx
// Fast hover state
<button className="transition-colors duration-150 ease-out">

// Modal entrance
<div className="transition-all duration-400 ease-spring">

// Staggered list items
<li className="animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
```

## Microanimation Patterns

### When to Use Each Animation

| Animation              | Use For                           | Duration               | Easing        |
| ---------------------- | --------------------------------- | ---------------------- | ------------- |
| **Hover state**        | Buttons, cards, links             | `150ms`                | `ease-out`    |
| **Focus ring**         | Form inputs, interactive elements | `150ms`                | `ease-out`    |
| **Card lift**          | Clickable cards, list items       | `250ms`                | `ease-out`    |
| **Toggle**             | Switches, checkboxes              | `250ms`                | `ease-spring` |
| **Modal open**         | Dialogs, drawers, popovers        | `400ms`                | `ease-spring` |
| **Page transition**    | Route changes, view switches      | `400ms`                | `ease-out`    |
| **Toast notification** | Success/error messages            | `400ms`                | `ease-out`    |
| **Stagger entrance**   | Lists, grids, dashboards          | `250ms` + `50ms` delay | `ease-out`    |
| **Skeleton shimmer**   | Loading placeholders              | `1.5s` loop            | `linear`      |
| **Spinner**            | Loading states                    | `800ms` loop           | `linear`      |
| **Pulse**              | Live indicators, notifications    | `2s` loop              | `ease-out`    |

## Animation Code Examples

### Button Hover

```jsx
<button
  className="
  bg-accent-primary
  hover:bg-accent-primary-soft
  hover:shadow-glow
  active:scale-[0.98]
  transition-all duration-150 ease-out
"
>
  Get Started
</button>
```

### Card Lift

```jsx
<div
  className="
  bg-ink-muted
  border border-ink-subtle
  hover:border-accent-primary
  hover:shadow-glow
  hover:-translate-y-1
  transition-all duration-250 ease-out
"
>
  Card content
</div>
```

### Toggle Switch

```jsx
// Toggle container
<button
  className={`
  w-14 h-8 rounded-full p-1
  transition-colors duration-150 ease-out
  ${active ? "bg-accent-primary" : "bg-ink-subtle"}
`}
>
  {/* Toggle knob */}
  <div
    className={`
    w-6 h-6 bg-surface rounded-full shadow-md
    transition-transform duration-250 ease-spring
    ${active ? "translate-x-6" : "translate-x-0"}
  `}
  />
</button>
```

### Input Focus

```jsx
<input
  className="
  bg-ink
  border border-ink-subtle
  focus:border-accent-primary
  focus:ring-2 focus:ring-accent-glow
  transition-all duration-150 ease-out
  outline-none
"
/>
```

### Skeleton Loading

```jsx
// Add to your global CSS or Tailwind config
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    var(--ink-subtle) 25%,
    var(--ink-muted) 50%,
    var(--ink-subtle) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

```jsx
<div className="skeleton h-4 rounded-sm w-full" />
<div className="skeleton h-4 rounded-sm w-4/5" />
<div className="skeleton h-4 rounded-sm w-3/5" />
```

### Pulse Indicator

```jsx
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-success opacity-75" />
  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-success" />
</span>
```

### Spinner

```jsx
<div
  className="
  w-8 h-8
  border-3 border-ink-subtle
  border-t-accent-primary
  rounded-full
  animate-spin
"
/>
```

### Toast Notification

```jsx
// Slide in from right
<div className="
  fixed bottom-4 right-4
  bg-ink border border-accent-success
  rounded-md px-4 py-3
  animate-slide-in-right
">
  <span className="w-2 h-2 bg-accent-success rounded-full mr-3" />
  Changes saved
</div>

// Add to CSS
@keyframes slideInRight {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in-right {
  animation: slideInRight 400ms var(--ease-out) forwards;
}
```

## Animation Principles

1. **Be purposeful** — Every animation should serve a function: guide attention, provide feedback, or show relationships

2. **Be fast** — UI should feel snappy. When in doubt, go shorter. 150-250ms covers most cases

3. **Be consistent** — Same interactions should have same animations across the product

4. **Respect motion preferences** — Always check `prefers-reduced-motion`:

   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

5. **Don't block** — Animations should never prevent user interaction or slow down perceived performance
