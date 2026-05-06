import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, usePathname } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

function useTabFlash() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const flash = () => {
    "worklet";
    opacity.value = withSequence(
      withTiming(0.16, { duration: 55, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }),
    );
    scale.value = withSequence(
      withTiming(1.03, { duration: 55, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
    );
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none" as const,
  }));

  return { flash, overlayStyle };
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
  const { flash, overlayStyle } = useTabFlash();

  const handleTabPress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    flash();
  };

  const makeTabButton = (children: React.ReactNode, onPress?: () => void) =>
    (props: { onPress?: () => void; children?: React.ReactNode; style?: object }) => (
      <TouchableOpacity
        {...props}
        activeOpacity={0.75}
        onPress={() => {
          handleTabPress();
          props.onPress?.();
        }}
      >
        {props.children}
      </TouchableOpacity>
    );

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
        {(["index", "analyze", "drills", "community", "profile"] as const).map((name) => {
          const icons: Record<string, { sf: string; feather?: string; material?: string }> = {
            index:     { sf: "house",                        feather: "home" },
            analyze:   { sf: "chart.bar.doc.horizontal",     feather: "zap" },
            drills:    { sf: "figure.boxing",                material: "boxing-glove" },
            community: { sf: "person.3",                     feather: "users" },
            profile:   { sf: "person",                       feather: "user" },
          };
          const titles: Record<string, string> = {
            index: "Dashboard", analyze: "Analyze",
            drills: "Drills", community: "Community", profile: "Profile",
          };
          const cfg = icons[name];
          return (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                title: titles[name],
                tabBarButton: (props: any) => (
                  <TouchableOpacity
                    {...props}
                    activeOpacity={0.75}
                    onPress={() => { handleTabPress(); props.onPress?.(); }}
                  />
                ),
                tabBarIcon: ({ color }: { color: string }) =>
                  isIOS ? (
                    <SymbolView name={cfg.sf as any} tintColor={color} size={24} />
                  ) : cfg.material ? (
                    <MaterialCommunityIcons name={cfg.material as any} size={22} color={color} />
                  ) : (
                    <Feather name={cfg.feather as any} size={22} color={color} />
                  ),
              }}
            />
          );
        })}
      </Tabs>
      {/* Full-screen punch flash overlay — plays on every tab press */}
      <Animated.View style={[overlayStyle, { backgroundColor: colors.primary, zIndex: 50 }]} pointerEvents="none" />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
