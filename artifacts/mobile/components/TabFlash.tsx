import React, { createContext, useCallback, useContext, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface TabFlashContextType {
  flash: () => void;
}

const TabFlashContext = createContext<TabFlashContextType>({ flash: () => {} });

export function useTabFlash() {
  return useContext(TabFlashContext);
}

export function TabFlashProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  const flash = useCallback(() => {
    opacity.value = withSequence(
      withTiming(0.18, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
    );
    scale.value = withSequence(
      withTiming(1.04, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
    );
  }, [opacity, scale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <TabFlashContext.Provider value={{ flash }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {children}
        <Animated.View
          style={[StyleSheet.absoluteFill, overlayStyle, { backgroundColor: colors.primary }]}
          pointerEvents="none"
        />
      </View>
    </TabFlashContext.Provider>
  );
}
