import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const BOXING_IMAGES = [
  "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
  "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
  "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80",
];

function useTabTransition() {
  const opacity = useSharedValue(0);
  const [imageIdx, setImageIdx] = useState(0);

  const trigger = () => {
    setImageIdx(Math.floor(Math.random() * BOXING_IMAGES.length));
    opacity.value = withSequence(
      withTiming(0.88, { duration: 320, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }),
    );
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    ...StyleSheet.absoluteFillObject,
  }));

  return { trigger, overlayStyle, imageIdx };
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="analyze">
        <Icon sf={{ default: "chart.bar.doc.horizontal", selected: "chart.bar.doc.horizontal.fill" }} />
        <Label>Analyze</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="drills">
        <Icon sf={{ default: "figure.boxing", selected: "figure.boxing" }} />
        <Label>Drills</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <Icon sf={{ default: "person.3", selected: "person.3.fill" }} />
        <Label>Community</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { trigger, overlayStyle, imageIdx } = useTabTransition();

  const handleTabPress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    trigger();
  };

  const TAB_CONFIG = [
    { name: "index",     title: "Dashboard", sf: "house",                    feather: "home" },
    { name: "analyze",   title: "Analyze",   sf: "chart.bar.doc.horizontal", feather: "zap" },
    { name: "drills",    title: "Drills",    sf: "figure.boxing",             material: "boxing-glove" },
    { name: "community", title: "Community", sf: "person.3",                  feather: "users" },
    { name: "profile",   title: "Profile",   sf: "person",                    feather: "user" },
  ] as const;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            ) : null,
        }}
      >
        {TAB_CONFIG.map((cfg) => (
          <Tabs.Screen
            key={cfg.name}
            name={cfg.name}
            options={{
              title: cfg.title,
              tabBarButton: (props: any) => (
                <TouchableOpacity
                  {...props}
                  activeOpacity={0.75}
                  onPress={() => {
                    handleTabPress();
                    props.onPress?.();
                  }}
                />
              ),
              tabBarIcon: ({ color }: { color: string }) =>
                isIOS ? (
                  <SymbolView name={cfg.sf as any} tintColor={color} size={24} />
                ) : "material" in cfg ? (
                  <MaterialCommunityIcons name={cfg.material as any} size={22} color={color} />
                ) : (
                  <Feather name={(cfg as any).feather} size={22} color={color} />
                ),
            }}
          />
        ))}
      </Tabs>

      {/* Boxing image crossfade — fades over 1 second on every tab press */}
      <Animated.View
        style={[overlayStyle, { zIndex: 50 }]}
        pointerEvents="none"
      >
        <Image
          source={{ uri: BOXING_IMAGES[imageIdx] }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
        {/* Dark tint so the image isn't too jarring */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.35)" },
          ]}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
