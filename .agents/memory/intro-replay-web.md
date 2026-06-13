---
name: Intro replay on web
description: How to prevent the intro cutscene from replaying on every tab switch in Expo web
---

On web, Metro HMR can re-evaluate modules and expo-router may remount layout components on URL changes. A single module-level flag (`let _introDone = false`) is not reliable because the module can be re-evaluated.

**Rule:** Use TWO independent layers to guard the intro:

**Layer 1 — parent layout (`_layout.tsx`)**
- `sessionStorage` key: `boxer_ai_intro_done`
- `useState(() => readIntroDone())` — lazy initializer reads sessionStorage on every RootLayout mount
- `handleIntroFinish` calls `writeIntroDone()` (sets sessionStorage to '1') before `setIntroDone(true)`
- `{!introDone && <IntroVideo ... />}` — don't render if already done

**Layer 2 — IntroVideo component itself**
- Render guard: `if (introDoneInStorage()) return null;` — renders nothing if already shown
- Mount effect: `if (introDoneInStorage()) { onFinish(); return; }` — triggers parent cleanup
- `handleFinish()`: calls `markIntroDoneInStorage()` FIRST (before fade animation), so tab switch during fade doesn't re-show intro

**Why:** sessionStorage persists within a browser tab across React re-renders, module re-evaluations, and SPA navigations. It clears when the browser tab is closed (which is the desired behavior — show intro once per session).

**How to apply:** Always mark storage at the START of the dismiss gesture, not in the animation callback. The animation can run for 700ms during which a navigation event could remount the component.
