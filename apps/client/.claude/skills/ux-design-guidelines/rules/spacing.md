# Spacing Rules

Uses a **4px base unit** system.

## Spacing Scale

| Name | Value          | Tailwind Class           | Usage                      |
| ---- | -------------- | ------------------------ | -------------------------- |
| `1`  | 4px / 0.25rem  | `p-1`, `m-1`, `gap-1`    | Tight internal spacing     |
| `2`  | 8px / 0.5rem   | `p-2`, `m-2`, `gap-2`    | Icon gaps, tight padding   |
| `3`  | 12px / 0.75rem | `p-3`, `m-3`, `gap-3`    | Button padding, list gaps  |
| `4`  | 16px / 1rem    | `p-4`, `m-4`, `gap-4`    | Default component padding  |
| `6`  | 24px / 1.5rem  | `p-6`, `m-6`, `gap-6`    | Card padding, section gaps |
| `8`  | 32px / 2rem    | `p-8`, `m-8`, `gap-8`    | Large card padding         |
| `12` | 48px / 3rem    | `p-12`, `m-12`, `gap-12` | Section spacing            |
| `16` | 64px / 4rem    | `p-16`, `m-16`, `gap-16` | Page section padding       |
| `24` | 96px / 6rem    | `p-24`, `m-24`, `gap-24` | Large section separation   |

## Spacing Guidelines

- Use `gap-*` for flex/grid layouts instead of margins
- Maintain consistent padding within component types
- Section spacing should be larger than component spacing
- Use `space-y-*` for vertical stacking

## Common Spacing Patterns

```jsx
// Button padding
<button className="px-6 py-3">

// Card padding
<div className="p-6">

// Section spacing
<section className="py-16">

// Flex gap
<div className="flex gap-4">

// Grid gap
<div className="grid grid-cols-3 gap-6">

// Vertical stack
<div className="space-y-4">
```
