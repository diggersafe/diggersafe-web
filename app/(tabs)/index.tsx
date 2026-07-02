import { useCallback, useState } from "react";
import { FlatList, Text, View, TouchableOpacity, RefreshControl, TextInput, Platform, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/app-header";
import { useColors } from "@/hooks/use-colors";
import { getMachines, getInspections, getServiceRecords, isServiceDue, type Machine, type Inspection, type ServiceRecord } from "@/lib/store";
import { SubscriptionExpiredBanner, useWriteAccess } from "@/components/subscription-gate";

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

function getLastInspectionText(machineId: string, inspections: Inspection[]): string {
  const machineInspections = inspections.filter((i) => i.machineId === machineId);
  if (machineInspections.length === 0) return "Never inspected";
  const latest = machineInspections[0];
  const lastDate = new Date(latest.date);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince === 0) return "Inspected today";
  if (daysSince === 1) return "Inspected yesterday";
  return `Inspected ${daysSince} days ago`;
}

function StatusBadge({ status }: { status: string }) {
  const colors = useColors();
  const bgColor =
    status === "active" ? colors.success + "15" :
    status === "grounded" ? colors.error + "15" :
    colors.muted + "15";
  const textColor =
    status === "active" ? colors.success :
    status === "grounded" ? colors.error :
    colors.muted;
  const label =
    status === "active" ? "Active" :
    status === "grounded" ? "Grounded" :
    "Retired";

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <View style={[styles.badgeDot, { backgroundColor: textColor }]} />
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function AlertBadge({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "15" }]}>
      <MaterialIcons name={icon as any} size={10} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

interface MachineCardProps {
  machine: Machine;
  dueSoon: boolean;
  serviceDueInfo: { due: boolean; serviceType?: string; hoursOverdue?: number };
  lastInspectionText: string;
  onPress: () => void;
}

function MachineCard({ machine, dueSoon, serviceDueInfo, lastInspectionText, onPress }: MachineCardProps) {
  const colors = useColors();
  const hasAlert = dueSoon || machine.status === "grounded" || serviceDueInfo.due;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: hasAlert ? colors.warning + "50" : colors.border + "60",
        },
      ]}
    >
      {/* Top row: Asset ID + badges */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.machineIcon, { backgroundColor: colors.primary + "18" }]}>
            <MaterialIcons name="construction" size={22} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.assetId, { color: colors.foreground }]}>
              {machine.assetId}
            </Text>
            <Text style={[styles.makeModel, { color: colors.muted }]}>
              {machine.makeModel}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted + "80"} />
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border + "40" }]} />

      {/* Bottom row: Meta info + badges */}
      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Text style={[styles.serialNumber, { color: colors.muted + "CC" }]}>
            S/N: {machine.serialNumber}
          </Text>
          <Text style={[styles.inspectionMeta, { color: colors.muted + "AA" }]}>
            {lastInspectionText}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          <StatusBadge status={machine.status} />
          {dueSoon && machine.status === "active" && (
            <AlertBadge label="Inspection Due" icon="schedule" color="#F59E0B" />
          )}
          {serviceDueInfo.due && (
            <AlertBadge label="Service Due" icon="build" color="#EF4444" />
          )}
        </View>
        {serviceDueInfo.due && serviceDueInfo.hoursOverdue !== undefined && (
          <Text style={[styles.overdueText, { color: colors.error }]}>
            {serviceDueInfo.serviceType} — {serviceDueInfo.hoursOverdue} hrs overdue
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function FleetScreen() {
  const colors = useColors();
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAllowed: canWrite, guardAction } = useWriteAccess();

  const loadData = useCallback(async () => {
    const [machineData, inspectionData, serviceData] = await Promise.all([
      getMachines(),
      getInspections(),
      getServiceRecords(),
    ]);
    setMachines(machineData);
    setInspections(inspectionData);
    setServiceRecords(serviceData);
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

  // Count machines with service alerts
  const machinesWithServiceDue = machines.filter((m) => isServiceDue(m, serviceRecords).due).length;
  const machinesDueSoon = machines.filter((m) => m.status === "active" && isDueSoon(m.id, inspections)).length;

  return (
    <ScreenContainer edges={["left", "right"]}>
      <AppHeader showSettings />

      {/* Fleet Title + Add Button */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Fleet</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {machines.length} {machines.length === 1 ? "machine" : "machines"} registered
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => guardAction(() => router.push("/add-machine" as any))}
            activeOpacity={0.7}
            style={[
              styles.addButton,
              { backgroundColor: canWrite ? colors.primary : colors.muted + "30" },
            ]}
          >
            <MaterialIcons name={canWrite ? "add" : "lock"} size={18} color="#1A1A1A" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <SubscriptionExpiredBanner />

        {/* Quick Stats */}
        {machines.length > 0 && (machinesWithServiceDue > 0 || machinesDueSoon > 0) && (
          <View style={[styles.alertRow, { borderColor: colors.border + "40" }]}>
            {machinesDueSoon > 0 && (
              <View style={[styles.alertChip, { backgroundColor: colors.warning + "12" }]}>
                <MaterialIcons name="schedule" size={14} color={colors.warning} />
                <Text style={[styles.alertChipText, { color: colors.warning }]}>
                  {machinesDueSoon} inspection{machinesDueSoon > 1 ? "s" : ""} due
                </Text>
              </View>
            )}
            {machinesWithServiceDue > 0 && (
              <View style={[styles.alertChip, { backgroundColor: colors.error + "12" }]}>
                <MaterialIcons name="build" size={14} color={colors.error} />
                <Text style={[styles.alertChipText, { color: colors.error }]}>
                  {machinesWithServiceDue} service{machinesWithServiceDue > 1 ? "s" : ""} overdue
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border + "80" }]}>
          <MaterialIcons name="search" size={20} color={colors.muted + "80"} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search fleet..."
            placeholderTextColor={colors.muted + "80"}
            style={[styles.searchInput, { color: colors.foreground }]}
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
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="construction" size={48} color={colors.muted + "50"} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No machines yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Tap "Add" to register your first machine
          </Text>
        </View>
      ) : filteredMachines.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={40} color={colors.muted + "50"} />
          <Text style={[styles.emptySubtitle, { color: colors.muted, marginTop: 12 }]}>
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
              serviceDueInfo={isServiceDue(item, serviceRecords)}
              lastInspectionText={getLastInspectionText(item.id, inspections)}
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

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  alertRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  alertChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  alertChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 11 : 7,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  machineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  assetId: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  makeModel: {
    fontSize: 13,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serialNumber: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inspectionMeta: {
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  overdueText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});

