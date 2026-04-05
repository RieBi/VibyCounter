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

### Reusable components

Located in `components/reusable/`: `ConfirmModal`, `ValidationToast`, `VibyInput`, `ColorPickerBar`, `CustomColorModal`, `IconPickerModal`, `CounterSettingsFields`.

## Conventions

### Component organization (top to bottom)
1. Props destructuring
2. Store/context hooks
3. State (`useState`)
4. Derived values / memos
5. Refs (`useRef`, `useSharedValue`)
6. Effects (`useEffect`)
7. Handlers
8. Early returns
9. JSX

### State selectors
Use `useShallow` from `zustand/react/shallow` when selecting derived arrays. Derive filtered/sorted data inside the selector, not in component state.

### Modals
- **Never put modals inside list items** — each `Modal` allocates native resources even when `visible={false}`. Lift shared modals to the parent screen, pass IDs through state.
- Close-on-backdrop pattern: outer `Pressable onPress={onClose}` wrapping inner `Pressable className='w-full'` (no `onPress`) to block propagation.
- Sub-modals: track open state to disable parent's `KeyboardAwareScrollView`. Use `setTimeout(~300ms)` when closing sub-modals to let keyboard dismiss first.

### Gestures & animations
- Each Android `Modal` needs its own `GestureHandlerRootView` (modals are separate native windows).
- Gesture coexistence (drawer + reorderable list): use `.simultaneousWithExternalGesture()` and careful `activeOffset`/`failOffset` tuning.
- Long press select vs drag: track `didMove` ref — set true in pan gesture's `onStart`, check in `onPressOut`.
- Custom animated bottom sheets/drawers: use `Animated.View` with `absolute inset-0` instead of `Modal` when you need independent backdrop/content animations.

### Performance
- **Memoized list items must be defined at module scope** — `memo()` on a component inside another component is useless (React sees a new definition every render).
- Use `FlashList` v2 from `@shopify/flash-list` for large lists (icon picker, etc.).
- Debounce search inputs (250ms).
- Always profile in release mode (`npx expo run:android --device --variant release`) — dev mode adds 2–10x overhead.

### Android / Windows build
- **260-char path limit**: CMake/ninja in Android NDK doesn't respect `LongPathsEnabled`. Project lives at `C:\vc` (junction) to keep paths short. Don't use `subst` — breaks Metro's path resolution.
- Nav bar scrim: handled by custom Expo config plugin in `plugins/disableNavBarContrast.js`.
- Packages with native code (MMKV, Reanimated, Keyboard Controller) require dev build, not Expo Go.

### TextInput on Android
- Use `VibyInput` (in `components/reusable/`) instead of raw `TextInput` — wraps `selectTextOnFocus` and the long-press keyboard refocus fix.
- Vertical text alignment: `lineHeight` matching icon size is the reliable fix (not `includeFontPadding`/`textAlignVertical`).
