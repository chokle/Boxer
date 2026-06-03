import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { TabBgImage, TAB_BG_IMAGES } from "@/components/TabBgImage";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Gym = {
  id: number; name: string; city: string; state: string;
  coachName: string | null; activeMembers: number | null; specialties: string | null;
};
type Fighter = {
  id: number; name: string; gymName: string | null; weightClass: string;
  stance: string; age: number | null; status: string;
  recordWins: number; recordLosses: number; recordDraws: number;
  rankAmateur: number | null; rankPro: number | null; style: string; bio: string | null;
};
type Tournament = {
  id: number; name: string; city: string; state: string; venue: string | null;
  startDate: string; endDate: string | null; type: string; status: string;
  weightClasses: string | null; entryDeadline: string | null;
  maxParticipants: number | null; registeredCount: number;
  entryFee: number | null; description: string | null; contactEmail: string | null;
};

const WEIGHT_CLASSES = ["All", "Flyweight", "Lightweight", "Welterweight", "Middleweight", "Heavyweight"];
const STATUS_OPTIONS = ["All", "amateur", "pro"];
const SECTIONS = ["Gyms", "Fighters", "Tournaments"] as const;
type Section = typeof SECTIONS[number];

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = makeStyles(colors);

  const [activeSection, setActiveSection] = useState<Section>("Tournaments");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [weightFilter, setWeightFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [gymSearch, setGymSearch] = useState("");
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [opponents, setOpponents] = useState<Fighter[]>([]);
  const [loadingOpponents, setLoadingOpponents] = useState(false);

  const fetchGyms = useCallback(async () => {
    const res = await fetch(`${API_BASE}/community/gyms`);
    const json = await res.json();
    setGyms(json.gyms ?? []);
  }, []);

  const fetchFighters = useCallback(async () => {
    const params = new URLSearchParams();
    if (weightFilter !== "All") params.set("weight_class", weightFilter);
    if (statusFilter !== "All") params.set("status", statusFilter);
    const res = await fetch(`${API_BASE}/community/fighters?${params}`);
    const json = await res.json();
    setFighters(json.fighters ?? []);
  }, [weightFilter, statusFilter]);

  const fetchTournaments = useCallback(async () => {
    const res = await fetch(`${API_BASE}/community/tournaments?status=upcoming`);
    const json = await res.json();
    setTournaments(json.tournaments ?? []);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchGyms(), fetchFighters(), fetchTournaments()]);
    } finally {
      setLoading(false);
    }
  }, [fetchGyms, fetchFighters, fetchTournaments]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (activeSection === "Fighters") fetchFighters(); }, [weightFilter, statusFilter, fetchFighters, activeSection]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const findOpponents = async (fighter: Fighter) => {
    if (selectedFighter?.id === fighter.id) {
      setSelectedFighter(null);
      setOpponents([]);
      return;
    }
    setSelectedFighter(fighter);
    setLoadingOpponents(true);
    try {
      const res = await fetch(`${API_BASE}/community/fighters/${fighter.id}/opponents`);
      const json = await res.json();
      setOpponents(json.opponents ?? []);
    } finally {
      setLoadingOpponents(false);
    }
  };

  const formatRecord = (w: number, l: number, d: number) => `${w}-${l}${d > 0 ? `-${d}` : ""}`;
  const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatFee = (cents: number | null) => cents ? `$${(cents / 100).toFixed(0)} entry` : "Free";
  const spotsLeft = (max: number | null, registered: number) => max ? max - registered : null;

  const filteredGyms = gyms.filter(g =>
    gymSearch.trim() === "" ||
    g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
    g.city.toLowerCase().includes(gymSearch.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <TabBgImage uri={TAB_BG_IMAGES.community} />
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
      <View style={s.header}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Community</Text>
        <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Local gyms, fighter rankings & upcoming events</Text>
      </View>

      {/* Section Tabs */}
      <View style={s.segmentWrap}>
        {SECTIONS.map(sec => (
          <TouchableOpacity
            key={sec}
            style={[s.segment, { backgroundColor: activeSection === sec ? colors.primary : colors.muted, borderColor: activeSection === sec ? colors.primary : colors.border }]}
            onPress={() => setActiveSection(sec)}
            activeOpacity={0.8}
          >
            <Text style={[s.segmentText, { color: activeSection === sec ? "#fff" : colors.mutedForeground }]}>{sec}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

      {/* ── GYMS ─────────────────────────────────────────────────────────── */}
      {!loading && activeSection === "Gyms" && (
        <View style={{ paddingHorizontal: 20 }}>
          <TextInput
            style={[s.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Search gyms or cities..."
            placeholderTextColor={colors.mutedForeground}
            value={gymSearch}
            onChangeText={setGymSearch}
          />
          {filteredGyms.map(gym => (
            <View key={gym.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardHeader}>
                <View style={[s.gymIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Feather name="map-pin" size={16} color={colors.primary} />
                </View>
                <View style={s.cardHeaderText}>
                  <Text style={[s.cardTitle, { color: colors.foreground }]}>{gym.name}</Text>
                  <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{gym.city}, {gym.state}</Text>
                </View>
              </View>
              {gym.coachName && (
                <View style={s.metaRow}>
                  <Feather name="user" size={12} color={colors.mutedForeground} />
                  <Text style={[s.metaText, { color: colors.mutedForeground }]}>{gym.coachName}</Text>
                </View>
              )}
              {gym.activeMembers != null && (
                <View style={s.metaRow}>
                  <Feather name="users" size={12} color={colors.mutedForeground} />
                  <Text style={[s.metaText, { color: colors.mutedForeground }]}>{gym.activeMembers} active members</Text>
                </View>
              )}
              {gym.specialties && (
                <Text style={[s.specialties, { color: colors.mutedForeground, borderColor: colors.border }]}>{gym.specialties}</Text>
              )}
            </View>
          ))}
          {filteredGyms.length === 0 && (
            <Text style={[s.empty, { color: colors.mutedForeground }]}>No gyms found</Text>
          )}
        </View>
      )}

      {/* ── FIGHTERS ─────────────────────────────────────────────────────── */}
      {!loading && activeSection === "Fighters" && (
        <View style={{ paddingHorizontal: 20 }}>
          {/* Filters */}
          <Text style={[s.filterLabel, { color: colors.mutedForeground }]}>WEIGHT CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={s.chipRow}>
              {WEIGHT_CLASSES.map(w => (
                <TouchableOpacity
                  key={w}
                  style={[s.chip, { backgroundColor: weightFilter === w ? colors.primary : colors.muted, borderColor: weightFilter === w ? colors.primary : colors.border }]}
                  onPress={() => setWeightFilter(w)}
                >
                  <Text style={[s.chipText, { color: weightFilter === w ? "#fff" : colors.mutedForeground }]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={[s.filterLabel, { color: colors.mutedForeground }]}>STATUS</Text>
          <View style={[s.chipRow, { marginBottom: 14 }]}>
            {STATUS_OPTIONS.map(st => (
              <TouchableOpacity
                key={st}
                style={[s.chip, { backgroundColor: statusFilter === st ? colors.primary : colors.muted, borderColor: statusFilter === st ? colors.primary : colors.border }]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[s.chipText, { color: statusFilter === st ? "#fff" : colors.mutedForeground }]}>{st.charAt(0).toUpperCase() + st.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {fighters.map((fighter, idx) => {
            const rank = fighter.status === "pro" ? fighter.rankPro : fighter.rankAmateur;
            const isSelected = selectedFighter?.id === fighter.id;
            return (
              <View key={fighter.id}>
                <TouchableOpacity
                  style={[s.card, { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border }]}
                  onPress={() => findOpponents(fighter)}
                  activeOpacity={0.8}
                >
                  <View style={s.fighterRow}>
                    <View style={[s.rankBadge, { backgroundColor: idx < 3 ? `${colors.primary}20` : colors.muted, borderColor: idx < 3 ? colors.primary : colors.border }]}>
                      <Text style={[s.rankText, { color: idx < 3 ? colors.primary : colors.mutedForeground }]}>#{rank ?? "—"}</Text>
                    </View>
                    <View style={s.fighterInfo}>
                      <View style={s.fighterNameRow}>
                        <Text style={[s.cardTitle, { color: colors.foreground }]}>{fighter.name}</Text>
                        <View style={[s.statusBadge, { backgroundColor: fighter.status === "pro" ? `${colors.primary}20` : `${colors.success ?? "#22c55e"}20` }]}>
                          <Text style={[s.statusText, { color: fighter.status === "pro" ? colors.primary : (colors.success ?? "#22c55e") }]}>
                            {fighter.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                        {fighter.gymName ?? "Independent"} · {fighter.weightClass}
                      </Text>
                      <View style={s.fighterStats}>
                        <Text style={[s.recordText, { color: colors.foreground }]}>{formatRecord(fighter.recordWins, fighter.recordLosses, fighter.recordDraws)}</Text>
                        <Text style={[s.dotSep, { color: colors.mutedForeground }]}>·</Text>
                        <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{fighter.stance}</Text>
                        <Text style={[s.dotSep, { color: colors.mutedForeground }]}>·</Text>
                        <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{fighter.style}</Text>
                      </View>
                    </View>
                    <Feather name={isSelected ? "chevron-up" : "target"} size={16} color={isSelected ? colors.primary : colors.mutedForeground} />
                  </View>
                  {fighter.bio && (
                    <Text style={[s.bio, { color: colors.mutedForeground }]} numberOfLines={2}>{fighter.bio}</Text>
                  )}
                  {!isSelected && (
                    <Text style={[s.tapHint, { color: colors.primary }]}>Tap to find opponents</Text>
                  )}
                </TouchableOpacity>

                {/* Opponent Matches */}
                {isSelected && (
                  <View style={[s.opponentPanel, { backgroundColor: `${colors.primary}08`, borderColor: colors.primary }]}>
                    <Text style={[s.opponentTitle, { color: colors.primary }]}>
                      <Feather name="target" size={13} color={colors.primary} /> Suggested Opponents for {fighter.name}
                    </Text>
                    {loadingOpponents ? (
                      <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
                    ) : opponents.length === 0 ? (
                      <Text style={[s.empty, { color: colors.mutedForeground }]}>No matched opponents found in the same class</Text>
                    ) : opponents.map(opp => (
                      <View key={opp.id} style={[s.opponentRow, { borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.opponentName, { color: colors.foreground }]}>{opp.name}</Text>
                          <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{opp.gymName ?? "Independent"} · {opp.stance}</Text>
                          <Text style={[s.recordText, { color: colors.foreground, fontSize: 12 }]}>{formatRecord(opp.recordWins, opp.recordLosses, opp.recordDraws)} · {opp.style}</Text>
                        </View>
                        <View style={[s.matchScore, { backgroundColor: colors.muted }]}>
                          <Feather name="check-circle" size={12} color={colors.primary} />
                          <Text style={[s.matchScoreText, { color: colors.primary }]}>Match</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          {fighters.length === 0 && !loading && (
            <Text style={[s.empty, { color: colors.mutedForeground }]}>No fighters found</Text>
          )}
        </View>
      )}

      {/* ── TOURNAMENTS ──────────────────────────────────────────────────── */}
      {!loading && activeSection === "Tournaments" && (
        <View style={{ paddingHorizontal: 20 }}>
          {tournaments.map(t => {
            const spots = spotsLeft(t.maxParticipants, t.registeredCount);
            const almostFull = spots !== null && spots < 20;
            return (
              <View key={t.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.cardHeader}>
                  <View style={[s.tourneyIcon, { backgroundColor: t.type === "pro" ? `${colors.primary}20` : `${colors.success ?? "#22c55e"}15` }]}>
                    <Feather name="award" size={16} color={t.type === "pro" ? colors.primary : (colors.success ?? "#22c55e")} />
                  </View>
                  <View style={s.cardHeaderText}>
                    <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{t.name}</Text>
                    <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{t.city}, {t.state}</Text>
                  </View>
                  <View style={[s.typeBadge, { backgroundColor: t.type === "pro" ? `${colors.primary}20` : `${colors.success ?? "#22c55e"}15` }]}>
                    <Text style={[s.typeText, { color: t.type === "pro" ? colors.primary : (colors.success ?? "#22c55e") }]}>
                      {t.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {t.venue && (
                  <View style={s.metaRow}>
                    <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                    <Text style={[s.metaText, { color: colors.mutedForeground }]}>{t.venue}</Text>
                  </View>
                )}
                <View style={s.metaRow}>
                  <Feather name="calendar" size={12} color={colors.primary} />
                  <Text style={[s.metaText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {formatDate(t.startDate)}{t.endDate ? ` – ${formatDate(t.endDate)}` : ""}
                  </Text>
                </View>
                {t.entryDeadline && (
                  <View style={s.metaRow}>
                    <Feather name="clock" size={12} color={colors.mutedForeground} />
                    <Text style={[s.metaText, { color: colors.mutedForeground }]}>Registration closes {formatDate(t.entryDeadline)}</Text>
                  </View>
                )}
                {t.weightClasses && (
                  <View style={s.metaRow}>
                    <Feather name="layers" size={12} color={colors.mutedForeground} />
                    <Text style={[s.metaText, { color: colors.mutedForeground }]} numberOfLines={2}>{t.weightClasses}</Text>
                  </View>
                )}

                <View style={s.tourneyFooter}>
                  <View style={s.metaRow}>
                    <Feather name="tag" size={12} color={colors.mutedForeground} />
                    <Text style={[s.metaText, { color: colors.mutedForeground }]}>{formatFee(t.entryFee)}</Text>
                  </View>
                  {spots !== null && (
                    <View style={[s.spotsBadge, { backgroundColor: almostFull ? `${colors.primary}15` : colors.muted }]}>
                      <Text style={[s.spotsText, { color: almostFull ? colors.primary : colors.mutedForeground }]}>
                        {spots} {spots === 1 ? "spot" : "spots"} left
                      </Text>
                    </View>
                  )}
                </View>

                {t.description && (
                  <Text style={[s.bio, { color: colors.mutedForeground, marginTop: 8 }]} numberOfLines={3}>{t.description}</Text>
                )}
                {t.contactEmail && (
                  <Text style={[s.contactText, { color: colors.primary }]}>{t.contactEmail}</Text>
                )}
              </View>
            );
          })}
          {tournaments.length === 0 && (
            <Text style={[s.empty, { color: colors.mutedForeground }]}>No upcoming tournaments</Text>
          )}
        </View>
      )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, marginBottom: 20 },
    pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
    pageSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
    segmentWrap: { flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 20 },
    segment: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
    segmentText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 14 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
    cardHeaderText: { flex: 1 },
    cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    cardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
    gymIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    tourneyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
    metaText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
    specialties: { fontSize: 12, fontFamily: "Inter_400Regular", borderTopWidth: 1, paddingTop: 10, marginTop: 6, fontStyle: "italic" },
    filterLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
    fighterRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    rankBadge: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    rankText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    fighterInfo: { flex: 1 },
    fighterNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
    statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
    fighterStats: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    recordText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    dotSep: { fontSize: 12 },
    statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
    bio: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, lineHeight: 18 },
    tapHint: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 8, textAlign: "right" },
    opponentPanel: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12, marginTop: -4 },
    opponentTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
    opponentRow: { paddingVertical: 10, borderTopWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
    opponentName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    matchScore: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    matchScoreText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    typeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
    tourneyFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
    spotsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    spotsText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    contactText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6 },
    empty: { textAlign: "center", marginTop: 40, fontSize: 14, fontFamily: "Inter_400Regular" },
  });
}
