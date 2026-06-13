import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { IntroVideo } from "@/components/IntroVideo";
import { BoxingProvider } from "@/context/BoxingContext";

// Keep all tab screens mounted so content doesn't re-animate on every switch.
// react-native-screens sets activityState=0 (STATE_INACTIVE) on unfocused tabs
// which detaches them even when detachInactiveScreens={false} is set on the
// navigator. Disabling native screen management makes MaybeScreen fall back to
// plain Views: all tabs stay in the tree and switching is just a zIndex swap.
enableScreens(false);

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Persist intro-done across module re-evaluations (web) and React remounts.
// sessionStorage survives tab switches & HMR reloads; falls back to a
// module-level flag for native (no sessionStorage).
const INTRO_KEY = 'boxer_ai_intro_done';

function readIntroDone(): boolean {
  if (typeof window !== 'undefined') {
    const stored = window.sessionStorage?.getItem(INTRO_KEY);
    console.log('[IntroGuard] readIntroDone =', stored);
    return stored === '1';
  }
  return false;
}

function writeIntroDone(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage?.setItem(INTRO_KEY, '1');
    console.log('[IntroGuard] writeIntroDone done');
  }
}

const WEB_BG = "#0a0a0a";

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerShown: false,
        contentStyle: { backgroundColor: WEB_BG },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="session/[id]"
        options={{ headerShown: true, title: "Analysis", headerBackTitle: "Back" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [introDone, setIntroDone] = useState(() => readIntroDone());

  const handleIntroFinish = useCallback(() => {
    writeIntroDone();
    setIntroDone(true);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const root = document.documentElement;
    root.style.backgroundColor = WEB_BG;
    document.body.style.backgroundColor = WEB_BG;
    document.body.style.overflow = "hidden";
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BoxingProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
                {!introDone && <IntroVideo onFinish={handleIntroFinish} />}
              </KeyboardProvider>
            </GestureHandlerRootView>
          </BoxingProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
