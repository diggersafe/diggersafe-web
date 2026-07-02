import { useCallback, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMachines, deleteMachine, getInspections, getServiceRecordsForMachine, isServiceDue, type Machine, type Inspection, type ServiceRecord, SERVICE_TYPE_LABELS } from "@/lib/store";
import { SubscriptionExpiredBanner, useWriteAccess } from "@/components/subscription-gate";

export default function MachineDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [lastInspection, setLastInspection] = useState<Inspection | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const { isAllowed: canWrite, guardAction } = useWriteAccess();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const machines = await getMachines();
        const found = machines.find((m) => m.id === id);
        setMachine(found || null);

        const inspections = await getInspections();
        const machineInspections = inspections.filter((i) => i.machineId === id);
        if (machineInspections.length > 0) {
          setLastInspection(machineInspections[0]);
        }

        const services = await getServiceRecordsForMachine(id!);
        setServiceRecords(services);
      })();
    }, [id])
  );

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to delete this machine?")) {
        deleteMachine(id!).then(() => router.back());
      }
    } else {
      Alert.alert("Delete Machine", "Are you sure you want to delete this machine?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMachine(id!);
            router.back();
          },
        },
      ]);
    }
  };

  if (!machine) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground }}>Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header with back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Fleet</Text>
        </TouchableOpacity>

        {/* Machine Header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <MaterialIcons name="construction" size={36} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>
            {machine.assetId}
          </Text>
          <View
            style={{
              backgroundColor: machine.status === "active" ? colors.success + "20" : colors.muted + "20",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 6,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: machine.status === "active" ? colors.success : colors.muted,
              }}
            >
              {machine.status === "active" ? "Active" : "Retired"}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <MaterialIcons name="info-outline" size={18} color={colors.muted} />
            <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 6 }}>MAKE / MODEL</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
            {machine.makeModel}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <MaterialIcons name="tag" size={18} color={colors.muted} />
            <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 6 }}>SERIAL NUMBER</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, fontFamily: "monospace" }}>
            {machine.serialNumber}
          </Text>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 14 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <MaterialIcons name="schedule" size={18} color={colors.muted} />
            <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 6 }}>HOUR METER</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "monospace" }}>
            {machine.hourMeter} hrs
          </Text>
        </View>

        {/* Last Inspection */}
        {lastInspection && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8, textTransform: "uppercase" }}>
              Last Inspection
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground }}>
              {new Date(lastInspection.date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
              {" • "}
              {lastInspection.cleared ? "Cleared" : "Failed"}
            </Text>
          </View>
        )}

        <SubscriptionExpiredBanner />

        {/* Service Interval Alert */}
        {machine && serviceRecords.length > 0 && (() => {
          const serviceAlert = isServiceDue(machine, serviceRecords);
          if (!serviceAlert.due) return null;
          return (
            <View
              style={{
                backgroundColor: colors.error + "10",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.error + "25",
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <MaterialIcons name="build" size={20} color={colors.error} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.error }}>
                  Service Overdue
                </Text>
                <Text style={{ fontSize: 12, color: colors.error + "CC", marginTop: 2 }}>
                  {serviceAlert.serviceType} — {serviceAlert.hoursOverdue} hrs past due
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Start Pre-Start Check Button */}
        <TouchableOpacity
          onPress={() => guardAction(() => router.push(`/inspect/${machine.id}` as any))}
          activeOpacity={0.8}
          style={{
            backgroundColor: canWrite ? colors.primary : colors.muted + "40",
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <MaterialIcons name={canWrite ? "assignment" : "lock"} size={22} color="#1A1A1A" />
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#1A1A1A" }}>
            Start Pre-Start Check
          </Text>
        </TouchableOpacity>

        {/* Log Service Button */}
        <TouchableOpacity
          onPress={() => guardAction(() => router.push(`/add-service/${machine.id}` as any))}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialIcons name="build" size={20} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
            Log Service
          </Text>
        </TouchableOpacity>

        {/* Service History */}
        {serviceRecords.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, textTransform: "uppercase" }}>
              Service History
            </Text>
            {serviceRecords.slice(0, 5).map((record, index) => (
              <View key={record.id} style={{ marginBottom: index < serviceRecords.length - 1 ? 12 : 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {SERVICE_TYPE_LABELS[record.serviceType]}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {new Date(record.date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {record.hourMeter} hrs • {record.technician}
                  {record.nextServiceHours ? ` • Next: ${record.nextServiceHours} hrs` : ""}
                </Text>
                {index < serviceRecords.slice(0, 5).length - 1 && (
                  <View style={{ height: 1, backgroundColor: colors.border, marginTop: 12 }} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push(`/qr-tag/${machine.id}` as any)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              gap: 6,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialIcons name="qr-code-2" size={18} color={colors.foreground} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>QR Tag</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => guardAction(() => router.push(`/edit-machine/${machine.id}` as any))}
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              gap: 6,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialIcons name="edit" size={18} color={colors.foreground} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => guardAction(handleDelete)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.error + "10",
              borderRadius: 12,
              padding: 14,
              gap: 6,
              borderWidth: 1,
              borderColor: colors.error + "30",
            }}
          >
            <MaterialIcons name="delete" size={18} color={colors.error} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
