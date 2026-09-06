---
title: React 19 API Changes
impact: MEDIUM
impactDescription: cleaner component definitions and context usage
tags: react19, refs, context, hooks
---

## React 19 API Changes

> **⚠️ React 19+ only.** Skip this if you're on React 18 or earlier.

In React 19, `ref` is now a regular prop (no `forwardRef` wrapper needed), and `use()` can read context, including conditionally. `useContext()` remains
supported; do not migrate working context consumers solely for consistency.

**Existing ref wrapper (migration is optional for this task):**

```tsx
const ComposerInput = forwardRef<TextInput, Props>((props, ref) => {
  return <TextInput ref={ref} {...props} />
})
```

**Correct (ref as a regular prop):**

```tsx
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  return <TextInput ref={ref} {...props} />
}
```

**Supported context hook:**

```tsx
const value = useContext(MyContext)
```

**Alternative when conditional reading is useful:**

```tsx
const value = use(MyContext)
```

`use()` can also be called conditionally, unlike `useContext()`.

Reference: [React useContext](https://react.dev/reference/react/useContext).
