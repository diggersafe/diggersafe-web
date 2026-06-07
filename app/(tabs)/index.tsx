import { useCallback, useState } from "react";
import { FlatList, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMachines, type Machine } from "@/lib/store";

function StatusBadge({ status }: { status: string }) {
  const colors = useColors();
  const isActive = status === "active";
  const bgColor = isActive ? colors.success + "20" : colors.muted + "20";
  const textColor = isActive ? colors.success : colors.muted;
  const label = isActive ? "Active" : "Retired";

  return (
    <View style={{ backgroundColor: bgColor, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
      <Text style={{ color: textColor, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function MachineCard({ machine, onPress }: { machine: Machine; onPress: () => void }) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <MaterialIcons name="construction" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {machine.assetId}
            </Text>
            <StatusBadge status={machine.status} />
          </View>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
            {machine.makeModel}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2, fontFamily: "monospace" }}>
            {machine.hourMeter} hrs
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function FleetScreen() {
  const colors = useColors();
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMachines = useCallback(async () => {
    const data = await getMachines();
    setMachines(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMachines();
    }, [loadMachines])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMachines();
    setRefreshing(false);
  }, [loadMachines]);

  const activeCount = machines.filter((m) => m.status === "active").length;

  return (
    <ScreenContainer className="px-4 pt-2">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground }}>Fleet</Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {machines.length} machines registered
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/add-machine" as any)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            gap: 4,
          }}
        >
          <MaterialIcons name="add" size={18} color="#1A1A1A" />
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A1A" }}>Add Machine</Text>
        </TouchableOpacity>
      </View>

      {machines.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 }}>
          <MaterialIcons name="construction" size={64} color={colors.muted + "40"} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            No machines yet.{"\n"}Tap "+ Add Machine" to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={machines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MachineCard
              machine={item}
              onPress={() => router.push(`/machine/${item.id}` as any)}
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
