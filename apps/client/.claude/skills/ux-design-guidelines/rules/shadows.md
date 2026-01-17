# Shadow Rules

## Shadow Scale

| Name   | Value                              | Tailwind Class | Usage                    |
| ------ | ---------------------------------- | -------------- | ------------------------ |
| `sm`   | `0 1px 2px rgba(0,0,0,0.05)`       | `shadow-sm`    | Subtle elevation         |
| `md`   | `0 4px 6px -1px rgba(0,0,0,0.1)`   | `shadow-md`    | Cards, dropdowns         |
| `lg`   | `0 10px 15px -3px rgba(0,0,0,0.1)` | `shadow-lg`    | Modals, popovers         |
| `xl`   | `0 20px 25px -5px rgba(0,0,0,0.1)` | `shadow-xl`    | Large modals             |
| `glow` | `0 0 40px var(--accent-glow)`      | `shadow-glow`  | Focus states, highlights |

## Shadow Usage

```jsx
// Card with hover elevation
<div className="shadow-md hover:shadow-lg transition-shadow">
  Card content
</div>

// Focus glow effect
<button className="focus:shadow-glow focus:outline-none">
  Focused button
</button>
```

## Shadow Rules

- Use `shadow-md` for cards and elevated surfaces
- Use `shadow-lg` for modals and popovers
- Use `shadow-glow` for focus states and highlights
- Combine with `hover:shadow-lg` for interactive elevation
- Use `transition-shadow` for smooth shadow transitions
- Avoid excessive shadows - less is more
