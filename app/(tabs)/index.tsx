import { useCallback, useState } from "react";
import { FlatList, Text, View, TouchableOpacity, RefreshControl, TextInput, Platform } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/app-header";
import { useColors } from "@/hooks/use-colors";
import { getMachines, getInspections, type Machine, type Inspection } from "@/lib/store";

// Check if a machine is due for inspection (7 days since last inspection)
function isDueSoon(machineId: string, inspections: Inspection[]): boolean {
  const machineInspections = inspections.filter((i) => i.machineId === machineId);
  if (machineInspections.length === 0) return true; // Never inspected = due
  const latest = machineInspections[0]; // Already sorted newest first
  const lastDate = new Date(latest.date);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSince >= 5; // Due soon if 5+ days since last inspection
}

function StatusBadge({ status }: { status: string }) {
  const colors = useColors();
  const bgColor =
    status === "active" ? colors.success + "20" :
    status === "grounded" ? colors.error + "20" :
    colors.muted + "20";
  const textColor =
    status === "active" ? colors.success :
    status === "grounded" ? colors.error :
    colors.muted;
  const label =
    status === "active" ? "Active" :
    status === "grounded" ? "Grounded" :
    "Retired";

  return (
    <View style={{ backgroundColor: bgColor, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
      <Text style={{ color: textColor, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function DueSoonBadge() {
  return (
    <View style={{ backgroundColor: "#F59E0B20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 3 }}>
      <MaterialIcons name="warning" size={10} color="#F59E0B" />
      <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "600" }}>Due Soon</Text>
    </View>
  );
}

function MachineCard({ machine, dueSoon, onPress }: { machine: Machine; dueSoon: boolean; onPress: () => void }) {
  const colors = useColors();
  const needsAttention = dueSoon || machine.status === "grounded";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: needsAttention ? 1.5 : 1,
        borderColor: needsAttention ? colors.primary + "80" : colors.border,
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {machine.assetId}
            </Text>
            <StatusBadge status={machine.status} />
            {dueSoon && machine.status === "active" && <DueSoonBadge />}
          </View>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 3 }}>
            {machine.makeModel}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted + "90", marginTop: 2, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
            S/N:  {machine.serialNumber}
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
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredMachines = machines.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.assetId.toLowerCase().includes(q) ||
      m.makeModel.toLowerCase().includes(q) ||
      m.serialNumber.toLowerCase().includes(q)
    );
  });

  return (
    <ScreenContainer edges={["left", "right"]}>
      <AppHeader showSettings />

      {/* Fleet Title + Add Button */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>Fleet</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>
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

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: Platform.OS === "ios" ? 10 : 6,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 14,
          }}
        >
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search fleet..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 15,
              color: colors.foreground,
            }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Machine List */}
      {filteredMachines.length === 0 && machines.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 }}>
          <MaterialIcons name="construction" size={64} color={colors.muted + "40"} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            No machines yet.{"\n"}Tap "+ Add Machine" to get started.
          </Text>
        </View>
      ) : filteredMachines.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 }}>
          <MaterialIcons name="search-off" size={48} color={colors.muted + "40"} />
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            No machines match "{searchQuery}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMachines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MachineCard
              machine={item}
              dueSoon={isDueSoon(item.id, inspections)}
              onPress={() => router.push(`/machine/${item.id}` as any)}
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
