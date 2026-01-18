---
name: ux-design-guidelines
description: Apply time2ship design system when creating or updating UI components - enforces typography, colors, spacing, animations, and component patterns
---

# UX Design Guidelines Skill

## Purpose

This skill ensures all UI components follow the time2ship design system. Use this skill when:

- Creating new components
- Updating existing components
- Implementing designs
- Making UI/UX changes
- Styling any user-facing elements

## When to Use This Skill

**ALWAYS use this skill when:**

1. Creating new React components with UI elements
2. Updating component styles or classes
3. Implementing button, input, card, or badge components
4. Adding animations or transitions
5. Working with typography, colors, or spacing
6. Making any visual changes to the application

**Examples:**
- "Add a new button to the header"
- "Create a card component for the dashboard"
- "Update the form input styles"
- "Add hover animations to the navigation"
- "Style the user profile section"

## Design System Rules

The design system is organized into separate rule files:

1. **Typography** ([typography.md](./rules/typography.md))
   - Font families (Outfit, JetBrains Mono)
   - Type scale (5xl to xs)
   - Letter spacing rules
   - Gradient text effects
   - Responsive typography
   - Common typography patterns

2. **Colors** ([colors.md](./rules/colors.md))
   - Core palette (ink, surface variants)
   - Accent colors (primary, success, warning, error)
   - Color usage rules

3. **Spacing** ([spacing.md](./rules/spacing.md))
   - 4px base unit system
   - Spacing scale (1-24)
   - Spacing guidelines

4. **Border Radius** ([border-radius.md](./rules/border-radius.md))
   - Border radius scale (sm to 2xl, full)
   - Usage guidelines per component type

5. **Shadows** ([shadows.md](./rules/shadows.md))
   - Shadow scale (sm to xl, glow)
   - Shadow usage rules

6. **Animations** ([animations.md](./rules/animations.md))
   - Easing functions (ease-out, ease-spring, etc.)
   - Duration scale
   - Staggered animations
   - Microanimation patterns
   - Animation code examples

7. **Components** ([components.md](./rules/components.md))
   - Button variants (primary, outline, pill styles)
   - Input fields
   - Badges and pills
   - Cards
   - Hero sections
   - Responsive button groups
   - Component-specific rules

8. **Background Effects** ([background-effects.md](./rules/background-effects.md))
   - Grid backgrounds
   - Gradient glows
   - Decorative elements (terminal windows)
   - Layering and z-index strategy
   - Complete examples

9. **Tailwind Configuration** ([tailwind-config.md](./rules/tailwind-config.md))
   - Tailwind CSS v4 configuration
   - Global CSS setup with @theme directive
   - CSS variable definitions

## CRITICAL: Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4**, which has a different configuration approach than v3:

- **NO `tailwind.config.js` file** - Configuration is done via CSS variables
- **Uses `@theme` directive** in `globals.css` to define design tokens
- **CSS variables format**: `--color-*`, `--font-size-*`, `--radius-*`, etc.

**Before applying design system classes, ALWAYS verify that `app/globals.css` contains the design system theme configuration.** If the design system colors/tokens are not working, check that `globals.css` has been updated with all the CSS variables from [tailwind-config.md](./rules/tailwind-config.md).

### Quick Check
If you see errors like colors not working or classes not applying:
1. Read `app/globals.css`
2. Verify it contains `@theme inline` with all design system variables
3. If missing, update it using the configuration from [tailwind-config.md](./rules/tailwind-config.md)

## Workflow

### When Creating New Components

1. **Read the relevant rule files** based on what you're building:
   - For buttons: Read [components.md](./rules/components.md), [colors.md](./rules/colors.md), [animations.md](./rules/animations.md)
   - For forms: Read [components.md](./rules/components.md), [typography.md](./rules/typography.md), [spacing.md](./rules/spacing.md)
   - For cards: Read [components.md](./rules/components.md), [shadows.md](./rules/shadows.md), [animations.md](./rules/animations.md)
   - For hero sections: Read [components.md](./rules/components.md), [typography.md](./rules/typography.md), [background-effects.md](./rules/background-effects.md), [animations.md](./rules/animations.md)
   - For landing pages: Read [background-effects.md](./rules/background-effects.md), [components.md](./rules/components.md), [animations.md](./rules/animations.md)
   - For any text styling: Read [typography.md](./rules/typography.md)

2. **Apply the design system patterns** from the rules
   - Use exact Tailwind classes specified in the rules
   - Follow the component structure examples
   - Maintain consistent spacing, colors, and animations

3. **Verify compliance** by checking:
   - Colors use the defined palette (ink, surface, accent variants)
   - Typography uses the correct font family and scale
   - Spacing follows the 4px base unit system
   - Animations use the correct duration and easing
   - Components match the defined patterns

### When Updating Existing Components

1. **Read the current component code**

2. **Identify which design rules apply**
   - Typography changes? Read [typography.md](./rules/typography.md)
   - Color updates? Read [colors.md](./rules/colors.md)
   - Animation adjustments? Read [animations.md](./rules/animations.md)

3. **Apply updates following the design system**
   - Replace non-compliant classes with design system classes
   - Ensure consistency with other components
   - Add missing transitions or hover states

4. **Verify the updated component** matches the design system patterns

## Key Principles

### 1. Consistency First
- Always use the predefined Tailwind classes from the design system
- Don't create custom colors, spacing, or typography values
- Follow the established component patterns

### 2. Reference the Rules
- When in doubt, read the relevant rule file
- Use the code examples as templates
- Copy patterns from [components.md](./rules/components.md) for common components

### 3. Performance & Accessibility
- All animations must respect `prefers-reduced-motion`
- Use semantic HTML elements
- Maintain proper color contrast
- Include focus states for interactive elements

### 4. Responsive Design
- Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:)
- Test layouts at different breakpoints
- Use flexible units (rem, %, etc.) over fixed pixels

## Component Checklist

When creating or updating a component, verify:

- [ ] Colors are from the design system palette (ink/surface/accent)
- [ ] Typography uses correct font family (Outfit or JetBrains Mono)
- [ ] Spacing follows the 4px base unit system
- [ ] Border radius matches component type (hero buttons: full, standard buttons: md, cards: xl)
- [ ] Shadows are used appropriately (cards: md, modals: lg, primary buttons: glow)
- [ ] Transitions use correct duration (150-250ms for most interactions)
- [ ] Easing functions are appropriate (ease-out for most UI transitions)
- [ ] Hover states are defined for interactive elements
- [ ] Focus states include ring and border color changes
- [ ] Active states include scale or other tactile feedback (active:scale-[0.98])
- [ ] Component structure matches patterns in [components.md](./rules/components.md)
- [ ] Staggered animations use incremental delays (0.1s, 0.2s, 0.3s)
- [ ] Background effects include pointer-events-none
- [ ] Z-index layering is correct (backgrounds: z-0, content: z-[1])
- [ ] Responsive classes are applied where needed (flex-col sm:flex-row)
- [ ] Gradient text uses proper classes (bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent)

## Common Patterns Quick Reference

```jsx
// Hero headline with gradient text
<h1 className="text-5xl md:text-[3.815rem] font-bold leading-none tracking-tighter">
  Build fast.<br />
  <span className="bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent">
    Ship faster.
  </span>
</h1>

// Hero subtitle
<p className="text-xl text-surface-dim max-w-[600px] leading-relaxed">

// Section title
<h2 className="text-2xl font-semibold tracking-tight">

// Body text
<p className="text-base text-surface-dim">

// Feature badge with icon
<div className="inline-flex items-center gap-2 px-4 py-2 bg-ink-muted border border-ink-subtle rounded-full text-xs tracking-wide text-surface-dim">
  <svg className="w-4 h-4 text-accent-primary">...</svg>
  AI Friendly
</div>

// Hero CTA button (pill style)
<button className="px-8 py-4 bg-accent-primary hover:bg-accent-primary-soft text-white text-base rounded-full transition-all duration-150 ease-out hover:shadow-glow active:scale-[0.98]">

// Primary button (standard)
<button className="bg-accent-primary hover:bg-accent-primary-soft text-white px-6 py-3 rounded-md transition-all duration-150 ease-out hover:shadow-glow active:scale-[0.98]">

// Card
<div className="bg-ink-muted border border-ink-subtle rounded-xl p-6 hover:border-accent-primary hover:shadow-glow hover:-translate-y-0.5 transition-all duration-250 ease-out">

// Input
<input className="bg-ink border border-ink-subtle rounded-md px-4 py-3 focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all duration-150 ease-out outline-none">

// Staggered animations
<div className="animate-fade-up">First</div>
<div className="animate-fade-up-delay-1">Second</div>
<div className="animate-fade-up-delay-2">Third</div>

// Responsive button group
<div className="flex gap-4 flex-col sm:flex-row">
  <button>Primary</button>
  <button>Secondary</button>
</div>
```

## Examples

### Example 1: Creating a Hero Section

**Task:** "Create a hero section for a landing page"

**Workflow:**
1. Read [components.md](./rules/components.md) for hero section structure
2. Read [typography.md](./rules/typography.md) for headline and gradient text patterns
3. Read [background-effects.md](./rules/background-effects.md) for grid and glow effects
4. Read [animations.md](./rules/animations.md) for staggered animations
5. Apply the patterns:

```jsx
export default function HeroSection() {
  return (
    <section className="relative z-[1] h-screen overflow-hidden flex flex-col justify-center items-center text-center px-8">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(var(--color-ink-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      {/* Gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-glow), transparent)"
        }}
      />

      {/* Feature badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-ink-muted border border-ink-subtle rounded-full text-xs tracking-wide text-surface-dim mb-8 animate-fade-up">
        <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {/* icon */}
        </svg>
        AI Friendly
      </div>

      {/* Headline with gradient */}
      <h1 className="text-5xl md:text-[3.815rem] font-bold leading-none tracking-tighter mb-6 animate-fade-up-delay-1">
        Build fast.<br />
        <span className="bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent">
          Ship faster.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-xl text-surface-dim max-w-[600px] mb-12 leading-relaxed animate-fade-up-delay-2">
        A production-ready full-stack monorepo boilerplate.
      </p>

      {/* CTA buttons */}
      <div className="flex gap-4 animate-fade-up-delay-3 flex-col sm:flex-row">
        <button className="px-8 py-4 bg-accent-primary hover:bg-accent-primary-soft text-white text-base rounded-full transition-all duration-150 ease-out hover:shadow-glow active:scale-[0.98]">
          Start shipping
        </button>
        <button className="px-8 py-4 bg-transparent hover:bg-ink-subtle text-surface border border-ink-subtle hover:border-surface-dim text-base rounded-full transition-all duration-150 ease-out">
          See repository
        </button>
      </div>
    </section>
  );
}
```

### Example 2: Creating a Primary Button

**Task:** "Add a submit button to the form"

**Workflow:**
1. Read [components.md](./rules/components.md) to get the primary button pattern
2. Apply the pattern:

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
  Submit
</button>
```

### Example 2: Creating a Feature Card

**Task:** "Create a card component for the features section"

**Workflow:**
1. Read [components.md](./rules/components.md) for card pattern
2. Read [shadows.md](./rules/shadows.md) for elevation
3. Read [animations.md](./rules/animations.md) for hover effects
4. Apply the patterns:

```jsx
<div className="
  bg-ink-muted
  border border-ink-subtle
  rounded-xl
  p-6
  hover:border-accent-primary
  hover:shadow-glow
  hover:-translate-y-0.5
  transition-all duration-250 ease-out
">
  <span className="text-xs font-medium tracking-widest uppercase text-accent-primary-soft mb-4 block">
    Feature
  </span>
  <h3 className="text-xl font-semibold tracking-tight mb-2">
    Fast Development
  </h3>
  <p className="text-surface-dim">
    Build and ship features in record time.
  </p>
</div>
```

### Example 3: Updating Form Input Styles

**Task:** "Update the email input to match the design system"

**Workflow:**
1. Read current input component
2. Read [components.md](./rules/components.md) for input pattern
3. Replace classes:

```jsx
// Before (non-compliant)
<input
  type="email"
  className="w-full p-3 border rounded"
/>

// After (design system compliant)
<input
  type="email"
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
```

## Anti-Patterns to Avoid

### ❌ Don't Do This

```jsx
// Custom colors not in the design system
<button className="bg-blue-600 text-white">

// Random spacing values
<div className="p-5 m-7">

// Missing transitions
<button className="bg-accent-primary">

// Inconsistent border radius
<div className="rounded-lg">  {/* Should be rounded-xl for cards */}

// No hover states
<button className="bg-accent-primary text-white">

// Missing focus states
<input className="border">
```

### ✅ Do This Instead

```jsx
// Design system colors
<button className="bg-accent-primary hover:bg-accent-primary-soft text-white">

// Design system spacing (4px base unit)
<div className="p-6 m-8">

// With transitions
<button className="bg-accent-primary transition-all duration-150 ease-out">

// Correct border radius for component type
<div className="rounded-xl">  {/* Cards use xl */}

// With hover states
<button className="bg-accent-primary hover:bg-accent-primary-soft hover:shadow-glow text-white">

// With focus states
<input className="border border-ink-subtle focus:border-accent-primary focus:ring-2 focus:ring-accent-glow">
```

## Summary

**Before you write any UI code:**

1. Identify what you're building (button, card, input, etc.)
2. Read the relevant rule files
3. Use the exact patterns and classes from the design system
4. Verify your component matches the examples
5. Run through the component checklist

**Remember:** The design system exists to ensure consistency and quality. Always reference the rules and follow the patterns exactly.
