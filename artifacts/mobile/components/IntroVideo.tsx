import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
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

const FADE_OUT_DURATION = 700;
const TITLE_DELAY = 600;
const TITLE_DURATION = 800;
const SAFETY_TIMEOUT_MS = 9000;
const WEB_WEBM_URL = "/intro.webm";
const WEB_MP4_URL = "/intro.mp4";

interface IntroVideoProps {
  onFinish: () => void;
}

// Web uses a plain HTML5 <video> with the proper autoplay attributes
// because expo-video's web wrapper does not set autoplay/muted/playsinline
// on the underlying element, which browsers require for autoplay.
function WebIntroVideo({
  onEnded,
  onError,
}: {
  onEnded: () => void;
  onError: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => {
      // Don't bail on rejection — the <video autoPlay muted> attributes still
      // let the browser show frames as soon as it can. The safety timeout in
      // the parent handles the worst case if play() is blocked.
      v.play().catch(() => {});
    };
    if (v.readyState >= 2) {
      tryPlay();
    } else {
      v.addEventListener("loadeddata", tryPlay, { once: true });
      v.addEventListener("canplay", tryPlay, { once: true });
    }
    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
    };
  }, []);

  return (
    <video
      ref={ref as any}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={onEnded}
      onError={onError}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        backgroundColor: "#000",
      } as any}
    >
      <source src={WEB_WEBM_URL} type="video/webm" />
      <source src={WEB_MP4_URL} type="video/mp4" />
    </video>
  );
}

function NativeIntroVideo({ onEnded }: { onEnded: () => void }) {
  const player = useVideoPlayer(
    require("@/assets/videos/intro.mp4"),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.play();
    }
  );

  useEffect(() => {
    const endSub = player.addListener("playToEnd", () => {
      onEnded();
    });
    return () => {
      endSub.remove();
    };
  }, [player, onEnded]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
    />
  );
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
    titleOpacity.value = withDelay(
      TITLE_DELAY,
      withTiming(1, { duration: TITLE_DURATION, easing: Easing.out(Easing.cubic) })
    );
    titleTranslate.value = withDelay(
      TITLE_DELAY,
      withTiming(0, { duration: TITLE_DURATION, easing: Easing.out(Easing.cubic) })
    );
    skipOpacity.value = withDelay(
      1500,
      withTiming(1, { duration: 500 })
    );
  }, [titleOpacity, titleTranslate, skipOpacity]);

  // Safety net: ensure intro always exits even if events don't fire.
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleFinish();
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, overlayStyle]}
      pointerEvents="auto"
    >
      {Platform.OS === "web" ? (
        <WebIntroVideo onEnded={handleFinish} onError={handleFinish} />
      ) : (
        <NativeIntroVideo onEnded={handleFinish} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 56 }]}>
        <Animated.View style={titleStyle}>
          <Text style={styles.brandLabel}>BOXER · AI</Text>
          <Text style={styles.title}>Step Into the Ring</Text>
          <Text style={styles.subtitle}>
            Your personal AI coach is ready to break down every round.
          </Text>
        </Animated.View>
      </View>

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
