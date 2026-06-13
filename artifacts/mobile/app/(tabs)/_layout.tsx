import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

// ─── Native liquid-glass tab bar (iOS 26+) ──────────────────────────────────
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

// ─── Classic tab layout (Android + web) ─────────────────────────────────────
const TAB_CONFIG = [
  { name: "index",     title: "Dashboard", sf: "house",                    feather: "home"  },
  { name: "analyze",   title: "Analyze",   sf: "chart.bar.doc.horizontal", feather: "zap"   },
  { name: "drills",    title: "Drills",    sf: "figure.boxing",             material: "boxing-glove" },
  { name: "community", title: "Community", sf: "person.3",                  feather: "users" },
  { name: "profile",   title: "Profile",   sf: "person",                    feather: "user"  },
] as const;

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          contentStyle: { backgroundColor: "#0a0a0a" },
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
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    props.onPress?.();
                  }}
                />
              ),
              tabBarIcon: ({ color }: { color: string }) =>
                isIOS ? (
                  <SymbolView name={cfg.sf as any} tintColor={color} size={24} />
                ) : "material" in cfg ? (
                  <MaterialCommunityIcons name={(cfg as any).material} size={22} color={color} />
                ) : (
                  <Feather name={(cfg as any).feather} size={22} color={color} />
                ),
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
