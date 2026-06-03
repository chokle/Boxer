import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// One boxing image per tab — pre-fetched on startup by the first render
export const TAB_BG_IMAGES = {
  dashboard: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
  analyze:   "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
  drills:    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
  community: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
  profile:   "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80",
} as const;

interface TabBgImageProps {
  uri: string;
}

/**
 * Absolutely-positioned boxing image that fades in when this tab gains focus
 * and resets when it loses focus. Place as the first child inside the tab
 * screen's root View so it sits behind all scrollable content.
 */
export function TabBgImage({ uri }: TabBgImageProps) {
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // Fade in on first focus only — no reset on blur so it stays visible
      if (opacity.value < 1) {
        opacity.value = withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) });
      }
    }, [opacity])
  );

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animStyle]} pointerEvents="none">
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      {/* Dark scrim so cards and text remain fully readable */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.62)" }]} />
    </Animated.View>
  );
}
