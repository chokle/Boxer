import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import type { ExperienceLevel, Stance } from "@/types";

const STANCES: Stance[] = ["Orthodox", "Southpaw", "Switch"];
const LEVELS: ExperienceLevel[] = ["Beginner", "Intermediate", "Advanced", "Pro"];
const WEIGHT_CLASSES = [
  "Mini Flyweight", "Flyweight", "Bantamweight", "Featherweight",
  "Lightweight", "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight",
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile, sessions } = useBoxing();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [reach, setReach] = useState(profile?.reach_inches?.toString() ?? "");
  const [weightClass, setWeightClass] = useState(profile?.weight_class ?? "Middleweight");
  const [stance, setStance] = useState<Stance>(profile?.stance ?? "Orthodox");
  const [level, setLevel] = useState<ExperienceLevel>(profile?.experience_level ?? "Intermediate");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(profile.age?.toString() ?? "");
      setReach(profile.reach_inches?.toString() ?? "");
      setWeightClass(profile.weight_class);
      setStance(profile.stance);
      setLevel(profile.experience_level);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Required", "Please enter your name"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveProfile({
      name: name.trim(),
      weight_class: weightClass,
      experience_level: level,
      stance,
      age: age ? parseInt(age) : null,
      reach_inches: reach ? parseInt(reach) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const s = makeStyles(colors);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 120 : 100, paddingHorizontal: 20 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Boxer Profile</Text>
        <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Your stats improve AI coaching accuracy</Text>
      </Animated.View>

      {sessions.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <View style={[s.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StatItem label="Total Sessions" value={`${sessions.length}`} colors={colors} />
            <Divider colors={colors} />
            <StatItem label="Avg Score" value={`${Math.round(sessions.reduce((a, s) => a + s.analysis.overall_score, 0) / sessions.length)}`} colors={colors} />
            <Divider colors={colors} />
            <StatItem label="Drills Logged" value={`${sessions.reduce((a, s) => a + s.analysis.drills.length, 0)}`} colors={colors} />
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.duration(400).delay(120)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Personal Info</Text>

          <Label text="FULL NAME" colors={colors} />
          <TextInput
            style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            placeholder="Your name" placeholderTextColor={colors.mutedForeground}
            value={name} onChangeText={setName}
          />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Label text="AGE" colors={colors} />
              <TextInput
                style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                placeholder="—" placeholderTextColor={colors.mutedForeground}
                value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label text='REACH (IN")' colors={colors} />
              <TextInput
                style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                placeholder="—" placeholderTextColor={colors.mutedForeground}
                value={reach} onChangeText={setReach} keyboardType="number-pad" maxLength={3}
              />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(180)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Boxing Style</Text>

          <Label text="STANCE" colors={colors} />
          <View style={s.chipRow}>
            {STANCES.map(st => (
              <TouchableOpacity
                key={st}
                style={[s.chip, { backgroundColor: stance === st ? colors.primary : colors.muted, borderColor: stance === st ? colors.primary : colors.border }]}
                onPress={() => { setStance(st); Haptics.selectionAsync(); }}
              >
                <Text style={[s.chipText, { color: stance === st ? "#fff" : colors.mutedForeground }]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="EXPERIENCE LEVEL" colors={colors} style={{ marginTop: 16 }} />
          <View style={s.chipRow}>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l}
                style={[s.chip, { backgroundColor: level === l ? colors.primary : colors.muted, borderColor: level === l ? colors.primary : colors.border }]}
                onPress={() => { setLevel(l); Haptics.selectionAsync(); }}
              >
                <Text style={[s.chipText, { color: level === l ? "#fff" : colors.mutedForeground }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="WEIGHT CLASS" colors={colors} style={{ marginTop: 16 }} />
          <View style={s.chipRow}>
            {WEIGHT_CLASSES.map(w => (
              <TouchableOpacity
                key={w}
                style={[s.chip, { backgroundColor: weightClass === w ? colors.primary : colors.muted, borderColor: weightClass === w ? colors.primary : colors.border }]}
                onPress={() => { setWeightClass(w); Haptics.selectionAsync(); }}
              >
                <Text style={[s.chipText, { color: weightClass === w ? "#fff" : colors.mutedForeground }]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(240)}>
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: saved ? colors.success : colors.primary }]}
          onPress={handleSave} activeOpacity={0.8}
        >
          <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saved ? "Saved!" : "Save Profile"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

function Label({ text, colors, style }: { text: string; colors: ReturnType<typeof useColors>; style?: object }) {
  return <Text style={[{ fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, color: colors.mutedForeground, marginBottom: 8 }, style]}>{text}</Text>;
}
function StatItem({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>{value}</Text>
      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}
function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ width: 1, height: "100%", backgroundColor: colors.border }} />;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
    pageSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
    statsCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", marginBottom: 14 },
    section: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
    row: { flexDirection: "row", gap: 12 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 4 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
    saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
