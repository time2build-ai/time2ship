# Component Rules

## Buttons

### Primary Button

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

## Badges

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

## Component Rules

### Buttons
- Use `px-6 py-3` for standard button padding
- Use `rounded-md` for button border radius
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
- Use `px-3 py-1` for badge padding
- Use `text-xs font-medium tracking-widest uppercase` for badge text
- Use semantic colors for status badges

### Cards
- Use `rounded-xl` for card border radius
- Use `p-6` for card padding
- Add hover effects: `hover:border-accent-primary hover:shadow-glow hover:-translate-y-0.5`
- Use `transition-all duration-250 ease-out` for smooth transitions
- Card labels should use `text-xs font-medium tracking-widest uppercase`
