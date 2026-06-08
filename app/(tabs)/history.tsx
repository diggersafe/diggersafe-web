import { useCallback, useState, useMemo } from "react";
import { FlatList, Text, View, TouchableOpacity, RefreshControl, TextInput, Platform } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/app-header";
import { useColors } from "@/hooks/use-colors";
import { getInspections, type Inspection } from "@/lib/store";

type FilterPeriod = "all" | "week" | "month" | "3months";

function InspectionRow({ inspection, onPress }: { inspection: Inspection; onPress: () => void }) {
  const colors = useColors();
  const resultColor = inspection.cleared ? colors.success : colors.error;
  const resultLabel = inspection.cleared ? "Cleared" : "Grounded";
  const dateStr = new Date(inspection.date).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: resultColor + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <MaterialIcons
            name={inspection.cleared ? "check-circle" : "cancel"}
            size={22}
            color={resultColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
            {inspection.assetId} — {inspection.makeModel}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {dateStr} • {inspection.operator} • {inspection.hourMeter} hrs
          </Text>
        </View>
        <View style={{ backgroundColor: resultColor + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: resultColor }}>{resultLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");

  const loadInspections = useCallback(async () => {
    const data = await getInspections();
    setInspections(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInspections();
    }, [loadInspections])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInspections();
    setRefreshing(false);
  }, [loadInspections]);

  const filteredInspections = useMemo(() => {
    let result = inspections;

    // Filter by date period
    if (filterPeriod !== "all") {
      const now = new Date();
      let cutoff: Date;
      if (filterPeriod === "week") {
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filterPeriod === "month") {
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      result = result.filter((i) => new Date(i.date) >= cutoff);
    }

    // Filter by search text
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.assetId.toLowerCase().includes(q) ||
          i.makeModel.toLowerCase().includes(q) ||
          i.operator.toLowerCase().includes(q)
      );
    }

    return result;
  }, [inspections, filterPeriod, search]);

  const filters: { key: FilterPeriod; label: string }[] = [
    { key: "all", label: "All" },
    { key: "week", label: "7 Days" },
    { key: "month", label: "30 Days" },
    { key: "3months", label: "90 Days" },
  ];

  return (
    <ScreenContainer edges={["left", "right"]}>
      <AppHeader />

      {/* Title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>History</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
          {filteredInspections.length} of {inspections.length} inspections
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by asset ID, model, or operator..."
            placeholderTextColor={colors.muted + "80"}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 8,
              fontSize: 14,
              color: colors.foreground,
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Filter Chips */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilterPeriod(f.key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: filterPeriod === f.key ? colors.primary + "20" : colors.surface,
                borderWidth: 1,
                borderColor: filterPeriod === f.key ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: filterPeriod === f.key ? colors.primary : colors.muted,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Inspection List */}
      {filteredInspections.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 }}>
          <MaterialIcons name="assignment" size={64} color={colors.muted + "40"} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            {inspections.length === 0
              ? "No inspections yet.\nComplete a pre-hire check to see it here."
              : "No inspections match your filters."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInspections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InspectionRow
              inspection={item}
              onPress={() => router.push(`/report/${item.id}` as any)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />
      )}
    </ScreenContainer>
  );
}
