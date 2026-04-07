---
description: 
alwaysApply: true
---

# CLAUDE.md

## Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (Expo Go or dev build)
expo run:android     # Build and run on Android
expo start --web     # Run web version
expo lint            # Lint the project
```

There is no test suite configured in this project.

## Architecture

**VibyCounter** is an Expo React Native app (TypeScript) using file-based routing via `expo-router`. It is a counter app with groups, history tracking, sorting, search, and bulk operations.

### Layer overview

| Layer         | Location               | Role                                                                               |
| ------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| State         | `shop/counterShop.ts`  | Zustand store, persisted with `react-native-mmkv`                                  |
| Types & utils | `vibes/definitions.ts` | interfaces, utilities                                                              |
| Hooks         | `hooks/`               | `useSearch`, `useSort`, `useSelection` — encapsulate UI logic for the index screen |
| Screen        | `app/index.tsx`        | Composes hooks + store, renders the counter list                                   |
| Components    | `components/`          | Feature modals + reusable UI                                                       |

### State management

Shops under ./shop folder are used for state management

### Styling

NativeWind (Tailwind for React Native) is used throughout

### Reusable components

Located in `components/reusable/`

## Conventions

### State selectors

Use `useShallow` from `zustand/react/shallow` when selecting derived arrays

### Modals

- **Never put modals inside list items** — each `Modal` allocates native resources even when `visible={false}`. Lift shared modals to the parent screen, pass IDs through state.
- Close-on-backdrop pattern: outer `Pressable onPress={onClose}` wrapping inner `Pressable className='w-full'` (no `onPress`) to block propagation.
- Never use blank Alert. Instead use modals or custom views.

### Gotchas

- Custom animated bottom sheets/drawers: use `Animated.View` with `absolute inset-0` instead of `Modal` when you need independent backdrop/content animations.
- Use `FlashList` v2 from `@shopify/flash-list` for large lists (icon picker, etc.).
- Use `VibyInput` (in `components/reusable/`) instead of raw `TextInput`
