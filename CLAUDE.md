# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (Expo Go or dev build)
expo run:android     # Build and run on Android
expo run:ios         # Build and run on iOS
expo start --web     # Run web version
expo lint            # Lint the project
```

There is no test suite configured in this project.

## Architecture

**VibyCounter** is an Expo React Native app (TypeScript) using file-based routing via `expo-router`. It is a counter app with groups, history tracking, sorting, search, and bulk operations.

### Layer overview

| Layer | Location | Role |
|---|---|---|
| State | `shop/counterShop.ts` | Zustand store, persisted with `react-native-mmkv` |
| Types & utils | `vibes/definitions.ts` | `Counter`, `Group`, `HistoryEntry` interfaces; `sortCounters()`, color utilities |
| Hooks | `hooks/` | `useSearch`, `useSort`, `useSelection` — encapsulate UI logic for the index screen |
| Screen | `app/index.tsx` | Composes hooks + store, renders the counter list with drag-to-reorder |
| Components | `components/` | Feature modals (Add, Edit, History, Group, Sort, MoveToGroup) + reusable UI |

### State management

`shop/counterShop.ts` is the single Zustand store. It holds `counters[]` and `groups[]` and persists both to MMKV under the key `'counter-storage'`. Every mutation (increment, reset, settings change) appends a `HistoryEntry` to the affected counter.

### Styling

NativeWind (Tailwind for React Native) is used throughout. Classes go in `className` props. The Tailwind config scans `./app/**` and `./components/**`. Global styles are in `global.css`.

### Routing

Single-screen app — `app/index.tsx` is the only route. `app/_layout.tsx` wraps it with the root layout.

### Key dependencies

- `zustand` — state management
- `react-native-mmkv` — persistent key-value storage
- `nativewind` — Tailwind CSS for React Native
- `react-native-reorderable-list` — drag-to-reorder counter list
- `expo-router` — file-based navigation
- `react-native-reanimated` + `react-native-gesture-handler` — animations and gestures

### Path alias

`@/*` resolves to the project root (configured in `tsconfig.json`).
