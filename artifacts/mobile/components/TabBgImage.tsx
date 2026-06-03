import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

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

export function TabBgImage({ uri }: TabBgImageProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: "rgba(0,0,0,0.62)",
  },
});
