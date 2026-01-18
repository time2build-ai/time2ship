# Component Rules

## Buttons

### Primary Button (Pill Style)

**Use this style for hero sections and primary CTAs:**

```jsx
<button className="
  inline-flex items-center justify-center gap-2
  px-8 py-4
  bg-accent-primary hover:bg-accent-primary-soft
  text-white text-base font-medium tracking-wide
  rounded-full
  transition-all duration-150 ease-out
  hover:shadow-glow
  active:scale-[0.98]
">
  Start shipping
</button>
```

### Outline Button (Pill Style)

**Use this style for secondary actions in hero sections:**

```jsx
<button className="
  inline-flex items-center justify-center gap-2
  px-8 py-4
  bg-transparent hover:bg-ink-subtle
  text-surface
  border border-ink-subtle hover:border-surface-dim
  text-base font-medium tracking-wide
  rounded-full
  transition-all duration-150 ease-out
">
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    {/* icon path */}
  </svg>
  See repository
</button>
```

### Primary Button (Standard)

**Use this style for forms and standard UI elements:**

```jsx
<button className="
  inline-flex items-center justify-center gap-2
  px-6 py-3
  bg-accent-primary hover:bg-accent-primary-soft
  text-white text-sm font-medium tracking-wide
  rounded-md
  transition-all duration-150 ease-out
  hover:shadow-glow
  active:scale-[0.98]
">
  Primary Button
</button>
```

### Secondary Button

```jsx
<button className="
  inline-flex items-center justify-center gap-2
  px-6 py-3
  bg-transparent hover:bg-ink-subtle
  text-surface
  border border-ink-subtle hover:border-surface-dim
  text-sm font-medium tracking-wide
  rounded-md
  transition-all duration-150 ease-out
">
  Secondary Button
</button>
```

### Ghost Button

```jsx
<button className="
  inline-flex items-center justify-center gap-2
  px-6 py-3
  bg-transparent hover:bg-ink-subtle
  text-surface-dim hover:text-surface
  text-sm font-medium tracking-wide
  rounded-md
  transition-all duration-150 ease-out
">
  Ghost Button
</button>
```

## Input Fields

```jsx
<div>
  <label
    className="
    block text-sm font-medium tracking-wide
    text-surface-dim mb-2
  "
  >
    Email address
  </label>
  <input
    type="email"
    placeholder="you@example.com"
    className="
      w-full px-4 py-3
      bg-ink text-surface
      border border-ink-subtle
      rounded-md
      placeholder:text-surface-dim/50
      focus:border-accent-primary
      focus:ring-2 focus:ring-accent-glow
      transition-all duration-150 ease-out
      outline-none
    "
  />
</div>
```

## Badges & Pills

### Feature Badge with Icon

**Use this style for hero sections and feature callouts:**

```jsx
<div className="
  inline-flex items-center gap-2
  px-4 py-2
  bg-ink-muted
  border border-ink-subtle
  rounded-full
  text-xs tracking-wide text-surface-dim
">
  <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    {/* icon path */}
  </svg>
  AI Friendly
</div>
```

### Default Badge

```jsx
<span className="
  inline-flex px-3 py-1
  bg-ink-subtle text-surface-dim
  text-xs font-medium tracking-widest uppercase
  rounded-full
">
  Default
</span>
```

### Primary Badge

```jsx
<span className="
  inline-flex px-3 py-1
  bg-accent-primary text-white
  text-xs font-medium tracking-widest uppercase
  rounded-full
">
  Primary
</span>
```

### Success Badge

```jsx
<span className="
  inline-flex px-3 py-1
  bg-accent-success text-white
  text-xs font-medium tracking-widest uppercase
  rounded-full
">
  Success
</span>
```

## Cards

```jsx
<div
  className="
  bg-ink-muted
  border border-ink-subtle
  rounded-xl
  p-6
  hover:border-accent-primary
  hover:shadow-glow
  hover:-translate-y-0.5
  transition-all duration-250 ease-out
"
>
  <span
    className="
    text-xs font-medium tracking-widest uppercase
    text-accent-primary-soft
    mb-4 block
  "
  >
    Card Label
  </span>
  <h3 className="text-xl font-semibold tracking-tight mb-2">Card Title</h3>
  <p className="text-surface-dim">Card description text goes here.</p>
</div>
```

## Hero Sections

### Hero Section Structure

```jsx
<section className="
  relative z-[1]
  h-screen overflow-hidden
  flex flex-col justify-center items-center text-center
  px-8
">
  {/* Background elements (grid, gradient) */}
  <HeroGridBackground />
  <BackgroundTerminals />

  {/* Feature badge */}
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-ink-muted border border-ink-subtle rounded-full text-xs tracking-wide text-surface-dim mb-8 animate-fade-up">
    <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {/* icon */}
    </svg>
    AI Friendly
  </div>

  {/* Headline with gradient text */}
  <h1 className="text-5xl md:text-[3.815rem] font-bold leading-none tracking-tighter mb-6 animate-fade-up-delay-1">
    Build fast.<br />
    <span className="bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent">
      Ship faster.
    </span>
  </h1>

  {/* Subtitle */}
  <p className="text-xl text-surface-dim max-w-[600px] mb-12 leading-relaxed animate-fade-up-delay-2">
    A production-ready full-stack monorepo boilerplate featuring Next.js 16, Express, PostgreSQL, and Docker.
  </p>

  {/* CTA buttons */}
  <div className="flex gap-4 animate-fade-up-delay-3 flex-col sm:flex-row">
    <button className="px-8 py-4 bg-accent-primary hover:bg-accent-primary-soft text-white rounded-full transition-all duration-150 ease-out hover:shadow-glow active:scale-[0.98]">
      Start shipping
    </button>
    <button className="px-8 py-4 bg-transparent hover:bg-ink-subtle text-surface border border-ink-subtle hover:border-surface-dim rounded-full transition-all duration-150 ease-out">
      See repository
    </button>
  </div>
</section>
```

### Gradient Text Effect

**Use for emphasis in headlines:**

```jsx
<h1 className="text-5xl font-bold tracking-tighter">
  Build fast.<br />
  <span className="bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent">
    Ship faster.
  </span>
</h1>
```

### Staggered Animations

**Use sequential fade-up animations with increasing delays:**

```jsx
{/* First element - no delay */}
<div className="animate-fade-up">...</div>

{/* Second element - 0.1s delay */}
<h1 className="animate-fade-up-delay-1">...</h1>

{/* Third element - 0.2s delay */}
<p className="animate-fade-up-delay-2">...</p>

{/* Fourth element - 0.3s delay */}
<div className="animate-fade-up-delay-3">...</div>
```

## Background Effects

### Grid Background with Glow

```jsx
export function HeroGridBackground() {
  return (
    <>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(var(--color-ink-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />
      {/* Radial gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-glow), transparent)"
        }}
      />
    </>
  );
}
```

### Decorative Terminal Components

**Use for dev-focused landing pages:**

```jsx
<div className="absolute top-20 left-[-10%] w-[550px] h-[350px] rotate-[-12deg] pointer-events-none z-0 animate-fade-up-delay-1">
  <div className="w-full h-full bg-[#1a1b26] border border-[#2a2b3d] rounded-lg overflow-hidden shadow-2xl">
    {/* Terminal header */}
    <div className="bg-[#16161e] px-4 py-2.5 flex items-center gap-2 border-b border-[#2a2b3d]">
      <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
      <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
      <span className="ml-2 text-xs text-surface-dim">terminal — zsh</span>
    </div>
    {/* Terminal content */}
    <div className="p-4 font-mono text-[11px] leading-relaxed text-surface-dim space-y-1.5">
      {/* Command lines */}
    </div>
  </div>
</div>
```

## Responsive Button Groups

**Use flex-col on mobile, flex-row on larger screens:**

```jsx
<div className="flex gap-4 flex-col sm:flex-row">
  <button>Primary Action</button>
  <button>Secondary Action</button>
</div>
```

## Component Rules

### Buttons
- **Hero CTAs**: Use `px-8 py-4`, `text-base`, and `rounded-full`
- **Standard buttons**: Use `px-6 py-3`, `text-sm`, and `rounded-md`
- Always include `transition-all duration-150 ease-out`
- Add `hover:shadow-glow` for primary buttons
- Add `active:scale-[0.98]` for tactile feedback
- Use `inline-flex items-center justify-center gap-2` for icon + text buttons

### Input Fields
- Use `px-4 py-3` for input padding
- Always include `focus:border-accent-primary` and `focus:ring-2 focus:ring-accent-glow`
- Use `outline-none` to remove default browser outline
- Use `placeholder:text-surface-dim/50` for placeholder styling
- Labels should use `text-sm font-medium tracking-wide text-surface-dim`

### Badges
- Use `rounded-full` for pill shape
- Standard badges: `px-3 py-1` padding
- Feature badges with icons: `px-4 py-2` padding, `gap-2`
- Use `text-xs font-medium tracking-widest uppercase` for badge text
- Use semantic colors for status badges

### Cards
- Use `rounded-xl` for card border radius
- Use `p-6` for card padding
- Add hover effects: `hover:border-accent-primary hover:shadow-glow hover:-translate-y-0.5`
- Use `transition-all duration-250 ease-out` for smooth transitions
- Card labels should use `text-xs font-medium tracking-widest uppercase`

### Hero Sections
- Use `h-screen` for full viewport height
- Center content with `flex flex-col justify-center items-center text-center`
- Add `relative z-[1]` to ensure content appears above background effects
- Use staggered animations (animate-fade-up-delay-1, -2, -3, etc.)
- Limit subtitle width with `max-w-[600px]` for readability
- Use responsive typography (e.g., `text-5xl md:text-[3.815rem]`)

### Background Effects
- Grid backgrounds should be `absolute inset-0 pointer-events-none`
- Use CSS variables for dynamic theming: `var(--color-ink-subtle)`, `var(--color-accent-glow)`
- Set appropriate opacity (e.g., `opacity-40` for grid)
- Layer multiple effects with z-index control
