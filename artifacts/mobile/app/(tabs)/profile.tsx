import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Platform, Alert, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import type { ExperienceLevel, Stance, Injury, InjuryArea, InjurySeverity } from "@/types";
import { TabBgImage, TAB_BG_IMAGES } from "@/components/TabBgImage";

const STANCES: Stance[] = ["Orthodox", "Southpaw", "Switch"];
const LEVELS: ExperienceLevel[] = ["Beginner", "Intermediate", "Advanced", "Pro"];
const WEIGHT_CLASSES = [
  "Mini Flyweight", "Flyweight", "Bantamweight", "Featherweight",
  "Lightweight", "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight",
];
const INJURY_AREAS: InjuryArea[] = [
  "Head", "Neck", "Shoulder", "Elbow", "Hand/Wrist",
  "Ribs", "Back", "Hip", "Knee", "Ankle/Foot", "Other",
];
const SEVERITIES: InjurySeverity[] = ["Mild", "Moderate", "Severe"];
const SEVERITY_COLORS: Record<InjurySeverity, string> = {
  Mild: "#22c55e",
  Moderate: "#f59e0b",
  Severe: "#ef4444",
};

function calcBMI(weightKg: number, heightCm: number): string {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return bmi.toFixed(1);
}
function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
function kgToLbs(kg: number) { return (kg * 2.20462).toFixed(1); }
function lbsToKg(lbs: number) { return (lbs / 2.20462).toFixed(1); }
function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return `${ft}'${inches}"`;
}
function ftInToCm(ft: number, inches: number) { return Math.round((ft * 12 + inches) * 2.54); }

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

  // Weight / Height / BMI
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("lbs");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("ft");
  const [weightKg, setWeightKg] = useState<number | null>(profile?.weight_kg ?? null);
  const [heightCm, setHeightCm] = useState<number | null>(profile?.height_cm ?? null);
  const [weightDisplay, setWeightDisplay] = useState(
    profile?.weight_kg ? (weightUnit === "kg" ? profile.weight_kg.toString() : kgToLbs(profile.weight_kg)) : ""
  );
  const [heightDisplay, setHeightDisplay] = useState(
    profile?.height_cm ? (heightUnit === "cm" ? profile.height_cm.toString() : cmToFtIn(profile.height_cm)) : ""
  );

  // Injuries
  const [injuries, setInjuries] = useState<Injury[]>(profile?.injuries ?? []);
  const [injuryModalVisible, setInjuryModalVisible] = useState(false);
  const [newArea, setNewArea] = useState<InjuryArea>("Shoulder");
  const [newSeverity, setNewSeverity] = useState<InjurySeverity>("Mild");
  const [newNotes, setNewNotes] = useState("");
  const [newActive, setNewActive] = useState(true);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(profile.age?.toString() ?? "");
      setReach(profile.reach_inches?.toString() ?? "");
      setWeightClass(profile.weight_class);
      setStance(profile.stance);
      setLevel(profile.experience_level);
      setWeightKg(profile.weight_kg ?? null);
      setHeightCm(profile.height_cm ?? null);
      setInjuries(profile.injuries ?? []);
      if (profile.weight_kg) setWeightDisplay(weightUnit === "kg" ? profile.weight_kg.toString() : kgToLbs(profile.weight_kg));
      if (profile.height_cm) setHeightDisplay(heightUnit === "cm" ? profile.height_cm.toString() : cmToFtIn(profile.height_cm));
    }
  }, [profile]);

  const handleWeightChange = (val: string) => {
    setWeightDisplay(val);
    const n = parseFloat(val);
    if (!isNaN(n)) setWeightKg(weightUnit === "kg" ? n : parseFloat(lbsToKg(n)));
    else setWeightKg(null);
  };

  const handleHeightChange = (val: string) => {
    setHeightDisplay(val);
    const n = parseFloat(val);
    if (!isNaN(n)) setHeightCm(heightUnit === "cm" ? n : Math.round(n * 30.48));
    else setHeightCm(null);
  };

  const toggleWeightUnit = () => {
    const next = weightUnit === "kg" ? "lbs" : "kg";
    setWeightUnit(next);
    if (weightKg) setWeightDisplay(next === "kg" ? weightKg.toFixed(1) : kgToLbs(weightKg));
  };

  const toggleHeightUnit = () => {
    const next = heightUnit === "cm" ? "ft" : "cm";
    setHeightUnit(next);
    if (heightCm) setHeightDisplay(next === "cm" ? heightCm.toString() : cmToFtIn(heightCm));
  };

  const bmi = weightKg && heightCm ? parseFloat(calcBMI(weightKg, heightCm)) : null;

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
      weight_kg: weightKg,
      height_cm: heightCm,
      injuries,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addInjury = () => {
    if (!newNotes.trim()) { Alert.alert("Required", "Please describe the injury"); return; }
    const injury: Injury = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      area: newArea,
      severity: newSeverity,
      notes: newNotes.trim(),
      date: new Date().toISOString().split("T")[0],
      active: newActive,
    };
    setInjuries(prev => [injury, ...prev]);
    setInjuryModalVisible(false);
    setNewNotes("");
    setNewArea("Shoulder");
    setNewSeverity("Mild");
    setNewActive(true);
    Haptics.selectionAsync();
  };

  const toggleInjuryActive = (id: string) => {
    setInjuries(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
    Haptics.selectionAsync();
  };

  const removeInjury = (id: string) => {
    Alert.alert("Remove Injury", "Remove this injury from your record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setInjuries(prev => prev.filter(i => i.id !== id)) },
    ]);
  };

  const s = makeStyles(colors);

  return (
    <View style={{ flex: 1 }}>
      <TabBgImage uri={TAB_BG_IMAGES.profile} />
      <ScrollView
        style={s.container}
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
            <StatItem label="Sessions" value={`${sessions.length}`} colors={colors} />
            <Divider colors={colors} />
            <StatItem label="Avg Score" value={`${Math.round(sessions.reduce((a, s) => a + s.analysis.overall_score, 0) / sessions.length)}`} colors={colors} />
            <Divider colors={colors} />
            <StatItem label="Drills" value={`${sessions.reduce((a, s) => a + s.analysis.drills.length, 0)}`} colors={colors} />
            <Divider colors={colors} />
            <StatItem label="Best" value={`${Math.max(...sessions.map(s => s.analysis.overall_score))}`} colors={colors} />
          </View>
        </Animated.View>
      )}

      {/* ── Personal Info ─────────────────────────────────────────────── */}
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

          {/* Weight */}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <View style={s.labelWithToggle}>
                <Label text="WEIGHT" colors={colors} style={{ marginBottom: 0 }} />
                <TouchableOpacity style={[s.unitToggle, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={toggleWeightUnit}>
                  <Text style={[s.unitToggleText, { color: colors.primary }]}>{weightUnit.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                placeholder="—" placeholderTextColor={colors.mutedForeground}
                value={weightDisplay} onChangeText={handleWeightChange}
                keyboardType="decimal-pad" maxLength={6}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.labelWithToggle}>
                <Label text="HEIGHT" colors={colors} style={{ marginBottom: 0 }} />
                <TouchableOpacity style={[s.unitToggle, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={toggleHeightUnit}>
                  <Text style={[s.unitToggleText, { color: colors.primary }]}>{heightUnit.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                placeholder={heightUnit === "ft" ? "e.g. 5.10" : "cm"}
                placeholderTextColor={colors.mutedForeground}
                value={heightDisplay} onChangeText={handleHeightChange}
                keyboardType="decimal-pad" maxLength={7}
              />
            </View>
          </View>

          {/* BMI Display */}
          {bmi !== null && (
            <Animated.View entering={FadeIn.duration(300)} style={[s.bmiCard, {
              backgroundColor: `${SEVERITY_COLORS[bmiCategory(bmi) === "Normal" ? "Mild" : bmiCategory(bmi) === "Overweight" ? "Moderate" : "Severe"]}15`,
              borderColor: `${SEVERITY_COLORS[bmiCategory(bmi) === "Normal" ? "Mild" : bmiCategory(bmi) === "Overweight" ? "Moderate" : "Severe"]}40`,
            }]}>
              <View>
                <Text style={[s.bmiLabel, { color: colors.mutedForeground }]}>BMI</Text>
                <Text style={[s.bmiValue, { color: colors.foreground }]}>{bmi.toFixed(1)}</Text>
              </View>
              <View style={s.bmiRight}>
                <Text style={[s.bmiCategory, {
                  color: SEVERITY_COLORS[bmiCategory(bmi) === "Normal" ? "Mild" : bmiCategory(bmi) === "Overweight" ? "Moderate" : "Severe"],
                }]}>{bmiCategory(bmi)}</Text>
                <Text style={[s.bmiNote, { color: colors.mutedForeground }]}>
                  {bmiCategory(bmi) === "Normal" ? "Healthy range for your height/weight" :
                   bmiCategory(bmi) === "Underweight" ? "Consider speaking to a sports nutritionist" :
                   bmiCategory(bmi) === "Overweight" ? "May affect your weight class bracket" :
                   "Significant impact on performance — consult coach"}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* ── Boxing Style ──────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400).delay(180)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Boxing Style</Text>

          <Label text="STANCE" colors={colors} />
          <View style={s.chipRow}>
            {STANCES.map(st => (
              <TouchableOpacity key={st}
                style={[s.chip, { backgroundColor: stance === st ? colors.primary : colors.muted, borderColor: stance === st ? colors.primary : colors.border }]}
                onPress={() => { setStance(st); Haptics.selectionAsync(); }}>
                <Text style={[s.chipText, { color: stance === st ? "#fff" : colors.mutedForeground }]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="EXPERIENCE LEVEL" colors={colors} style={{ marginTop: 16 }} />
          <View style={s.chipRow}>
            {LEVELS.map(l => (
              <TouchableOpacity key={l}
                style={[s.chip, { backgroundColor: level === l ? colors.primary : colors.muted, borderColor: level === l ? colors.primary : colors.border }]}
                onPress={() => { setLevel(l); Haptics.selectionAsync(); }}>
                <Text style={[s.chipText, { color: level === l ? "#fff" : colors.mutedForeground }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="WEIGHT CLASS" colors={colors} style={{ marginTop: 16 }} />
          <View style={s.chipRow}>
            {WEIGHT_CLASSES.map(w => (
              <TouchableOpacity key={w}
                style={[s.chip, { backgroundColor: weightClass === w ? colors.primary : colors.muted, borderColor: weightClass === w ? colors.primary : colors.border }]}
                onPress={() => { setWeightClass(w); Haptics.selectionAsync(); }}>
                <Text style={[s.chipText, { color: weightClass === w ? "#fff" : colors.mutedForeground }]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* ── Injuries ─────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400).delay(240)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeaderRow}>
            <Text style={[s.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Recent Injuries</Text>
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}
              onPress={() => setInjuryModalVisible(true)}
            >
              <Feather name="plus" size={14} color={colors.primary} />
              <Text style={[s.addBtnText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>

          {injuries.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No injuries logged — tap Add to record one</Text>
          ) : (
            injuries.map((injury) => (
              <View key={injury.id} style={[s.injuryRow, { borderColor: colors.border }]}>
                <View style={[s.severityDot, { backgroundColor: SEVERITY_COLORS[injury.severity] }]} />
                <View style={{ flex: 1 }}>
                  <View style={s.injuryHeader}>
                    <Text style={[s.injuryArea, { color: colors.foreground }]}>{injury.area}</Text>
                    <View style={s.injuryBadges}>
                      <View style={[s.badge, { backgroundColor: `${SEVERITY_COLORS[injury.severity]}20` }]}>
                        <Text style={[s.badgeText, { color: SEVERITY_COLORS[injury.severity] }]}>{injury.severity}</Text>
                      </View>
                      <TouchableOpacity
                        style={[s.badge, { backgroundColor: injury.active ? `${colors.primary}20` : colors.muted }]}
                        onPress={() => toggleInjuryActive(injury.id)}
                      >
                        <Text style={[s.badgeText, { color: injury.active ? colors.primary : colors.mutedForeground }]}>
                          {injury.active ? "Active" : "Resolved"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[s.injuryNotes, { color: colors.mutedForeground }]} numberOfLines={2}>{injury.notes}</Text>
                  <Text style={[s.injuryDate, { color: colors.mutedForeground }]}>{injury.date}</Text>
                </View>
                <TouchableOpacity onPress={() => removeInjury(injury.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: saved ? "#22c55e" : colors.primary }]}
          onPress={handleSave} activeOpacity={0.8}
        >
          <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saved ? "Saved!" : "Save Profile"}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Add Injury Modal ─────────────────────────────────────────── */}
      <Modal visible={injuryModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setInjuryModalVisible(false)}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Log Injury</Text>
            <TouchableOpacity onPress={() => setInjuryModalVisible(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <Label text="BODY AREA" colors={colors} />
            <View style={[s.chipRow, { marginBottom: 20 }]}>
              {INJURY_AREAS.map(a => (
                <TouchableOpacity key={a}
                  style={[s.chip, { backgroundColor: newArea === a ? colors.primary : colors.muted, borderColor: newArea === a ? colors.primary : colors.border }]}
                  onPress={() => { setNewArea(a); Haptics.selectionAsync(); }}>
                  <Text style={[s.chipText, { color: newArea === a ? "#fff" : colors.mutedForeground }]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="SEVERITY" colors={colors} />
            <View style={[s.chipRow, { marginBottom: 20 }]}>
              {SEVERITIES.map(sv => (
                <TouchableOpacity key={sv}
                  style={[s.chip, { backgroundColor: newSeverity === sv ? SEVERITY_COLORS[sv] : colors.muted, borderColor: newSeverity === sv ? SEVERITY_COLORS[sv] : colors.border }]}
                  onPress={() => { setNewSeverity(sv); Haptics.selectionAsync(); }}>
                  <Text style={[s.chipText, { color: newSeverity === sv ? "#fff" : colors.mutedForeground }]}>{sv}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="STATUS" colors={colors} />
            <View style={[s.chipRow, { marginBottom: 20 }]}>
              {[true, false].map(active => (
                <TouchableOpacity key={String(active)}
                  style={[s.chip, { backgroundColor: newActive === active ? colors.primary : colors.muted, borderColor: newActive === active ? colors.primary : colors.border }]}
                  onPress={() => { setNewActive(active); Haptics.selectionAsync(); }}>
                  <Text style={[s.chipText, { color: newActive === active ? "#fff" : colors.mutedForeground }]}>{active ? "Active / Current" : "Resolved"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="NOTES" colors={colors} />
            <TextInput
              style={[s.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              placeholder="Describe the injury, how it happened, current status..."
              placeholderTextColor={colors.mutedForeground}
              value={newNotes} onChangeText={setNewNotes}
              multiline numberOfLines={4} textAlignVertical="top"
            />

            <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.primary, marginTop: 24 }]} onPress={addInjury} activeOpacity={0.8}>
              <Feather name="plus" size={18} color="#fff" />
              <Text style={s.saveBtnText}>Log Injury</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

function Label({ text, colors, style }: { text: string; colors: ReturnType<typeof useColors>; style?: object }) {
  return <Text style={[{ fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, color: colors.mutedForeground, marginBottom: 8 }, style]}>{text}</Text>;
}
function StatItem({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground }}>{value}</Text>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{label}</Text>
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
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    row: { flexDirection: "row", gap: 12 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 4 },
    textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 100 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
    saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    labelWithToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    unitToggle: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    unitToggleText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
    bmiCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 6 },
    bmiLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
    bmiValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
    bmiRight: { flex: 1 },
    bmiCategory: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
    bmiNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "center", paddingVertical: 12 },
    injuryRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderTopWidth: 1 },
    severityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    injuryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
    injuryArea: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    injuryBadges: { flexDirection: "row", gap: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
    injuryNotes: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
    injuryDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
    modal: { flex: 1 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  });
}
