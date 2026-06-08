import { useCallback, useState } from "react";
import { FlatList, Text, View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/app-header";
import { useColors } from "@/hooks/use-colors";
import { getMachines, getInspections, type Machine, type Inspection } from "@/lib/store";

export default function InspectScreen() {
  const colors = useColors();
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [machineData, inspectionData] = await Promise.all([
      getMachines(),
      getInspections(),
    ]);
    setMachines(machineData);
    setInspections(inspectionData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Only show active machines that can be inspected
  const inspectableMachines = machines.filter((m) => m.status === "active" || m.status === "grounded");

  function getLastInspectionDate(machineId: string): string | null {
    const machineInspections = inspections.filter((i) => i.machineId === machineId);
    if (machineInspections.length === 0) return null;
    return machineInspections[0].date;
  }

  function getDaysSinceInspection(machineId: string): number | null {
    const machineInspections = inspections.filter((i) => i.machineId === machineId);
    if (machineInspections.length === 0) return null;
    const lastDate = new Date(machineInspections[0].date);
    const now = new Date();
    return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <ScreenContainer edges={["left", "right"]}>
      <AppHeader />

      {/* Title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>Inspect</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
          Select a machine to start a pre-hire check
        </Text>
      </View>

      {/* Machine List */}
      {inspectableMachines.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 }}>
          <MaterialIcons name="check-circle" size={64} color={colors.success + "40"} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            No machines available for inspection.{"\n"}Add machines in the Fleet tab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={inspectableMachines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const daysSince = getDaysSinceInspection(item.id);
            const lastDate = getLastInspectionDate(item.id);
            const isOverdue = daysSince === null || daysSince >= 5;

            return (
              <TouchableOpacity
                onPress={() => router.push(`/inspect/${item.id}` as any)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: isOverdue ? 1.5 : 1,
                  borderColor: isOverdue ? colors.primary + "80" : colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: item.status === "grounded" ? colors.error + "20" : colors.primary + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <MaterialIcons
                      name={item.status === "grounded" ? "block" : "construction"}
                      size={24}
                      color={item.status === "grounded" ? colors.error : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                        {item.assetId}
                      </Text>
                      {item.status === "grounded" && (
                        <View style={{ backgroundColor: colors.error + "20", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: "600", color: colors.error }}>GROUNDED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
                      {item.makeModel}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted + "80", marginTop: 3 }}>
                      {lastDate
                        ? `Last inspected: ${new Date(lastDate).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}${daysSince !== null ? ` (${daysSince}d ago)` : ""}`
                        : "Never inspected"}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}
                  >
                    <MaterialIcons name="play-arrow" size={20} color="#1A1A1A" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
