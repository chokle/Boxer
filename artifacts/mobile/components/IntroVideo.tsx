import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HOLD_MS = 3200;
const FADE_OUT_DURATION = 700;
const TITLE_DELAY = 600;
const TITLE_DURATION = 800;
const SAFETY_TIMEOUT_MS = 8000;

const PUNCH_IMAGE = require("@/assets/images/intro-punch.png");

interface IntroVideoProps {
  onFinish: () => void;
}

export function IntroVideo({ onFinish }: IntroVideoProps) {
  const insets = useSafeAreaInsets();
  const finishedRef = useRef(false);

  const overlayOpacity = useSharedValue(1);
  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(20);
  const skipOpacity = useSharedValue(0);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    overlayOpacity.value = withTiming(
      0,
      { duration: FADE_OUT_DURATION, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(onFinish)();
      }
    );
  };

  useEffect(() => {
    // Animate title in
    titleOpacity.value = withDelay(
      TITLE_DELAY,
      withTiming(1, { duration: TITLE_DURATION, easing: Easing.out(Easing.cubic) })
    );
    titleTranslate.value = withDelay(
      TITLE_DELAY,
      withTiming(0, { duration: TITLE_DURATION, easing: Easing.out(Easing.cubic) })
    );
    // Skip button fades in after 1.5 s
    skipOpacity.value = withDelay(1500, withTiming(1, { duration: 500 }));

    // Auto-advance after hold
    const timer = setTimeout(handleFinish, HOLD_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net
  useEffect(() => {
    const timeout = setTimeout(handleFinish, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOpacity.value }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, overlayStyle]}
      pointerEvents="auto"
    >
      {/* Full-bleed knockout punch image */}
      <Image
        source={PUNCH_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={0}
        cachePolicy="memory"
      />

      {/* Dark vignette gradient so text is legible */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.9)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Brand + tagline */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 56 }]}>
        <Animated.View style={titleStyle}>
          <Text style={styles.brandLabel}>BOXER · AI</Text>
          <Text style={styles.title}>Step Into the Ring</Text>
          <Text style={styles.subtitle}>
            Your personal AI coach is ready to break down every round.
          </Text>
        </Animated.View>
      </View>

      {/* Skip button */}
      <Animated.View
        style={[
          styles.skipWrap,
          { top: insets.top + (Platform.OS === "web" ? 24 : 12) },
          skipStyle,
        ]}
      >
        <TouchableOpacity onPress={handleFinish} activeOpacity={0.7} hitSlop={10}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    zIndex: 100,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
  },
  brandLabel: {
    color: "#fb923c",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 4,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 320,
  },
  skipWrap: {
    position: "absolute",
    right: 18,
  },
  skipText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
});
