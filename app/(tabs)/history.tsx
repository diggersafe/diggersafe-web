import { useCallback, useState } from "react";
import { FlatList, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getInspections, type Inspection } from "@/lib/store";

function InspectionRow({ inspection, onPress }: { inspection: Inspection; onPress: () => void }) {
  const colors = useColors();
  const resultColor = inspection.cleared ? colors.success : colors.error;
  const resultLabel = inspection.cleared ? "Cleared" : "Failed";
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
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            {inspection.assetId} — {inspection.makeModel}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            {dateStr} • {inspection.inspector}
          </Text>
        </View>
        <View style={{ backgroundColor: resultColor + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: resultColor }}>{resultLabel}</Text>
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

  return (
    <ScreenContainer className="px-4 pt-2">
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground }}>History</Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>
          {inspections.length} inspections completed
        </Text>
      </View>

      {inspections.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 }}>
          <MaterialIcons name="assignment" size={64} color={colors.muted + "40"} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            No inspections yet.{"\n"}Complete a pre-hire check to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={inspections}
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
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenContainer>
  );
}
