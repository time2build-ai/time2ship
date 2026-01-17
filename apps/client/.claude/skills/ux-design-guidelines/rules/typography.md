# Typography Rules

## Font Families

| Font               | Usage                                | Tailwind Class |
| ------------------ | ------------------------------------ | -------------- |
| **Outfit**         | All UI text — headings, body, labels | `font-sans`    |
| **JetBrains Mono** | Code, data, technical labels, badges | `font-mono`    |

## Type Scale

Uses a **1.25 (Major Third)** ratio for harmonious hierarchy.

| Name   | Size     | Weight | Tailwind Classes                | Usage                     |
| ------ | -------- | ------ | ------------------------------- | ------------------------- |
| `5xl`  | 3.815rem | 700    | `text-5xl font-bold`            | Display, hero headlines   |
| `4xl`  | 3.052rem | 700    | `text-4xl font-bold`            | Page headlines            |
| `3xl`  | 2.441rem | 600    | `text-3xl font-semibold`        | Section titles            |
| `2xl`  | 1.953rem | 600    | `text-2xl font-semibold`        | Card titles               |
| `xl`   | 1.563rem | 500    | `text-xl font-medium`           | Subsection titles         |
| `lg`   | 1.25rem  | 400    | `text-lg`                       | Body large, intros        |
| `base` | 1rem     | 400    | `text-base`                     | Body default              |
| `sm`   | 0.8rem   | 400    | `text-sm`                       | Captions, helper text     |
| `xs`   | 0.64rem  | 500    | `text-xs font-medium uppercase` | Overlines, badges, labels |

## Typography Rules

- Pair font size with appropriate letter-spacing and line-height
- Use `font-sans` for all UI text
- Use `font-mono` for code blocks, data tables, technical labels, and badges
- Large text (2xl+) should use tighter letter-spacing
- Small text (sm, xs) should use wider letter-spacing

## Letter Spacing

| Name      | Value    | Tailwind Class     | Usage                        |
| --------- | -------- | ------------------ | ---------------------------- |
| `tighter` | -0.05em  | `tracking-tighter` | Display headlines (4xl, 5xl) |
| `tight`   | -0.025em | `tracking-tight`   | Section titles (2xl, 3xl)    |
| `normal`  | 0        | `tracking-normal`  | Body text, paragraphs        |
| `wide`    | 0.025em  | `tracking-wide`    | Small text, captions         |
| `wider`   | 0.05em   | `tracking-wider`   | Labels, tags                 |
| `widest`  | 0.1em    | `tracking-widest`  | Overlines, badges, ALL CAPS  |

## Letter Spacing Rules

```jsx
// Display headlines — tight tracking
<h1 className="text-5xl font-bold tracking-tighter">
  Build fast. Ship faster.
</h1>

// Section titles — slightly tight
<h2 className="text-2xl font-semibold tracking-tight">
  Features
</h2>

// Body text — normal tracking
<p className="text-base tracking-normal">
  Your paragraph content here.
</p>

// Overlines & badges — wide tracking, uppercase
<span className="text-xs font-medium tracking-widest uppercase">
  New Feature
</span>
```

**Key principle:** As text gets larger, tighten the tracking. As text gets smaller, widen it.

## Common Typography Patterns

```jsx
// Hero headline
<h1 className="text-5xl font-bold tracking-tighter">

// Section title
<h2 className="text-2xl font-semibold tracking-tight">

// Body text
<p className="text-base text-surface-dim">

// Overline/label
<span className="text-xs font-medium tracking-widest uppercase text-accent-primary-soft">

// Code/mono text
<code className="font-mono text-sm">
```
