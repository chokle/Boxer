---
name: Tab re-animation on web
description: Why tab content animates on every switch on web and how to fix it
---

**Problem:** Tab screens re-animate (FadeInDown, FadeInRight etc.) on every tab switch in Expo web preview.

**Root causes (two separate issues):**

1. **Reanimated v4 on web**: `Animated.View` from react-native-reanimated injects CSS `transition` rules into the DOM even when NO `entering`/`exiting` props are set. Switching tabs re-mounts the component, triggering the transition.
   - **Fix:** Replace ALL `Animated.View` (from reanimated) with plain `View` from react-native in tab screen files. Keep `Animated.View` only where `useAnimatedStyle` is actually needed (e.g. IntroVideo overlay).

2. **react-native-screens v4 detaching tabs**: `react-native-screens` v4 sets `activityState=0` (STATE_INACTIVE) on unfocused tab screens, which detaches them from the DOM even when `detachInactiveScreens={false}` is set on the Tabs navigator.
   - **Fix:** Call `enableScreens(false)` at module level in root `_layout.tsx` BEFORE any navigator renders. This makes `MaybeScreen` fall back to plain Views so all tabs stay mounted.

**Stack:** Expo SDK 54, expo-router v6, react-native-screens v4.16, react-native-reanimated v4.
