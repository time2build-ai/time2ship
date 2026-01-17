# Border Radius Rules

## Border Radius Scale

| Name   | Value  | Tailwind Class | Usage                        |
| ------ | ------ | -------------- | ---------------------------- |
| `sm`   | 4px    | `rounded-sm`   | Small elements, tags         |
| `md`   | 8px    | `rounded-md`   | Buttons, inputs              |
| `lg`   | 12px   | `rounded-lg`   | Cards, dropdowns             |
| `xl`   | 16px   | `rounded-xl`   | Large cards, modals          |
| `2xl`  | 24px   | `rounded-2xl`  | Feature cards, hero elements |
| `full` | 9999px | `rounded-full` | Pills, avatars, badges       |

## Border Radius Guidelines

```jsx
// Buttons
<button className="rounded-md">Click me</button>

// Cards
<div className="rounded-xl">Card content</div>

// Badges/Pills
<span className="rounded-full px-3 py-1">Badge</span>

// Avatars
<img className="rounded-full" />
```

## Border Radius Rules

- Use `rounded-md` for buttons and inputs
- Use `rounded-xl` for cards and larger containers
- Use `rounded-full` for circular elements (avatars, badges, pills)
- Use `rounded-lg` for dropdowns and popovers
- Use `rounded-2xl` for hero sections and feature cards
- Use `rounded-sm` for small tags and labels
