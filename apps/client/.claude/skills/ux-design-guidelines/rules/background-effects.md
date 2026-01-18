# Background Effects

## Grid Backgrounds

### Subtle Grid Pattern

Use for hero sections and landing pages to add depth without overwhelming content:

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

**Guidelines:**
- Grid size: 60px x 60px for balanced spacing
- Opacity: 40% to keep it subtle
- Color: Use `var(--color-ink-subtle)` for grid lines
- Always include `pointer-events-none` to prevent interaction blocking
- Position: `absolute inset-0` with `z-0` to stay behind content

### Grid Pattern Variations

```jsx
// Tighter grid (30px)
backgroundSize: "30px 30px"

// Wider grid (100px)
backgroundSize: "100px 100px"

// More subtle grid (lower opacity)
className="absolute inset-0 opacity-20 pointer-events-none z-0"

// More prominent grid (higher opacity)
className="absolute inset-0 opacity-60 pointer-events-none z-0"
```

## Gradient Glows

### Top Radial Glow

Creates an accent-colored glow emanating from the top center:

```jsx
<div
  className="absolute inset-0 pointer-events-none z-0"
  style={{
    background: "radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-glow), transparent)"
  }}
/>
```

**Parameters:**
- Shape: `ellipse 80% 50%` (width 80%, height 50% of container)
- Position: `at 50% -20%` (centered horizontally, above the top)
- Colors: `var(--color-accent-glow)` fading to `transparent`

### Center Radial Glow

```jsx
<div
  className="absolute inset-0 pointer-events-none z-0"
  style={{
    background: "radial-gradient(circle at 50% 50%, var(--color-accent-glow), transparent 70%)"
  }}
/>
```

### Bottom Radial Glow

```jsx
<div
  className="absolute inset-0 pointer-events-none z-0"
  style={{
    background: "radial-gradient(ellipse 80% 50% at 50% 120%, var(--color-accent-glow), transparent)"
  }}
/>
```

### Multi-Color Gradient Glow

```jsx
<div
  className="absolute inset-0 pointer-events-none z-0"
  style={{
    background: "radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-glow), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(16, 185, 129, 0.1), transparent)"
  }}
/>
```

## Decorative Elements

### Rotated Terminal Windows

Use for developer-focused landing pages:

```jsx
{/* Top Left Terminal */}
<div className="absolute top-20 left-[-10%] w-[550px] h-[350px] rotate-[-12deg] pointer-events-none z-0 animate-fade-up-delay-1">
  <div className="w-full h-full bg-[#1a1b26] border border-[#2a2b3d] rounded-lg overflow-hidden shadow-2xl">
    {/* Terminal header with macOS-style controls */}
    <div className="bg-[#16161e] px-4 py-2.5 flex items-center gap-2 border-b border-[#2a2b3d]">
      <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
      <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
      <span className="ml-2 text-xs text-surface-dim">terminal — zsh</span>
    </div>
    {/* Terminal content */}
    <div className="p-4 font-mono text-[11px] leading-relaxed text-surface-dim space-y-1.5">
      {/* Command output */}
    </div>
  </div>
</div>

{/* Bottom Right Terminal (mirrored rotation) */}
<div className="absolute bottom-20 right-[-10%] w-[550px] h-[350px] rotate-[12deg] pointer-events-none z-0 animate-fade-up-delay-3">
  {/* Same structure */}
</div>
```

**Guidelines:**
- Rotation: -12deg for top-left, +12deg for bottom-right
- Position: Overflow by 10% to create partial visibility
- Size: 550px x 350px for realistic terminal proportions
- Colors: Use dark terminal theme colors (#1a1b26, #2a2b3d)
- Font: `font-mono text-[11px]` for authentic terminal text
- Animation: Add staggered fade-up animations
- Always include `pointer-events-none` to prevent interaction

### macOS Terminal Controls

```jsx
{/* Red, yellow, green dots */}
<div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
<div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
<div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
```

## Layering & Z-Index Strategy

### Proper Layering Order

```jsx
<section className="relative z-[1]">  {/* Main content container */}
  {/* Background effects - z-0 */}
  <div className="absolute inset-0 z-0 pointer-events-none">
    <HeroGridBackground />
    <BackgroundTerminals />
  </div>

  {/* Content - inherits z-[1] from parent */}
  <div className="relative z-[1]">
    <h1>Your content here</h1>
  </div>
</section>
```

**Z-Index Hierarchy:**
- Background effects: `z-0`
- Main content container: `z-[1]`
- Content within container: Inherit or `z-[1]`
- Modals/overlays: `z-50`
- Tooltips/dropdowns: `z-40`

## Complete Hero Section Example

```jsx
export default function HeroSection() {
  return (
    <section className="relative z-[1] h-screen overflow-hidden flex flex-col justify-center items-center text-center px-8">
      {/* Grid background with glow */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(var(--color-ink-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-glow), transparent)"
        }}
      />

      {/* Decorative terminals */}
      <BackgroundTerminals />

      {/* Hero content */}
      <div className="relative z-[1]">
        <h1 className="text-5xl md:text-[3.815rem] font-bold leading-none tracking-tighter">
          Build fast.<br />
          <span className="bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent">
            Ship faster.
          </span>
        </h1>
      </div>
    </section>
  );
}
```

## Background Effect Rules

### General Guidelines

1. **Subtlety First**: Background effects should enhance, not distract from content
2. **Performance**: Use CSS when possible instead of canvas/WebGL
3. **Pointer Events**: Always add `pointer-events-none` to background layers
4. **Positioning**: Use `absolute inset-0` for full coverage
5. **Z-Index**: Keep backgrounds at `z-0`, content at `z-[1]` or higher
6. **Opacity**: Start at 40% and adjust based on visual hierarchy needs
7. **Responsive**: Consider hiding or simplifying effects on mobile

### CSS Variables

Always use CSS variables for theming:
- Grid/lines: `var(--color-ink-subtle)`
- Glows: `var(--color-accent-glow)`
- Backgrounds: `var(--color-ink)`, `var(--color-ink-muted)`

This ensures proper theme compatibility and easy customization.

### Accessibility

- Don't rely on background effects for critical information
- Ensure sufficient contrast between background and text
- Consider `prefers-reduced-motion` for animated backgrounds
- Test with assistive technologies to ensure effects don't interfere

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up,
  .animate-fade-up-delay-1,
  .animate-fade-up-delay-2,
  .animate-fade-up-delay-3 {
    animation: none !important;
  }
}
```
