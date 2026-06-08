import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, ScrollView, TextInput, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getMachines,
  addServiceRecord,
  type Machine,
  type ServiceType,
  SERVICE_TYPE_LABELS,
} from "@/lib/store";

export default function AddServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("general");
  const [description, setDescription] = useState("");
  const [hourMeter, setHourMeter] = useState("");
  const [nextServiceHours, setNextServiceHours] = useState("");
  const [technician, setTechnician] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const machines = await getMachines();
        const found = machines.find((m) => m.id === id);
        if (found) {
          setMachine(found);
          setHourMeter(found.hourMeter.toString());
        }
      }
      load();
    }, [id])
  );

  const handleSave = async () => {
    if (!machine) return;
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a service description.");
      return;
    }
    if (!hourMeter.trim() || isNaN(Number(hourMeter))) {
      Alert.alert("Required", "Please enter a valid hour meter reading.");
      return;
    }
    if (!technician.trim()) {
      Alert.alert("Required", "Please enter the technician name.");
      return;
    }

    await addServiceRecord({
      machineId: machine.id,
      assetId: machine.assetId,
      date: new Date().toISOString().split("T")[0],
      serviceType,
      description: description.trim(),
      hourMeter: Number(hourMeter),
      nextServiceHours: nextServiceHours.trim() ? Number(nextServiceHours) : undefined,
      technician: technician.trim(),
      cost: cost.trim() ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  };

  const serviceTypes = Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][];

  if (!machine) return null;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4, marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>Log Service</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{machine.assetId} — {machine.makeModel}</Text>
          </View>
        </View>

        {/* Service Type Selector */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Service Type
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {serviceTypes.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setServiceType(key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: serviceType === key ? colors.primary + "20" : colors.surface,
                borderWidth: 1,
                borderColor: serviceType === key ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: serviceType === key ? colors.primary : colors.muted }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Description *
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Changed engine oil and filter, topped up hydraulic oil"
          placeholderTextColor={colors.muted + "80"}
          multiline
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 80,
            textAlignVertical: "top",
            marginBottom: 16,
          }}
        />

        {/* Hour Meter */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Hour Meter at Service *
        </Text>
        <TextInput
          value={hourMeter}
          onChangeText={setHourMeter}
          placeholder="e.g. 750"
          placeholderTextColor={colors.muted + "80"}
          keyboardType="numeric"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        />

        {/* Next Service Due (Hours) */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Next Service Due (Hours) — Optional
        </Text>
        <TextInput
          value={nextServiceHours}
          onChangeText={setNextServiceHours}
          placeholder="e.g. 1000 (alert when machine reaches this)"
          placeholderTextColor={colors.muted + "80"}
          keyboardType="numeric"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        />

        {/* Technician */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Technician *
        </Text>
        <TextInput
          value={technician}
          onChangeText={setTechnician}
          placeholder="Who performed the service"
          placeholderTextColor={colors.muted + "80"}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        />

        {/* Cost */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Cost ($) — Optional
        </Text>
        <TextInput
          value={cost}
          onChangeText={setCost}
          placeholder="e.g. 450"
          placeholderTextColor={colors.muted + "80"}
          keyboardType="numeric"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        />

        {/* Notes */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Notes — Optional
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes"
          placeholderTextColor={colors.muted + "80"}
          multiline
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 60,
            textAlignVertical: "top",
            marginBottom: 24,
          }}
        />

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A" }}>Save Service Record</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
