import { useEffect, useRef, useState } from "react";
import { Text, View, TouchableOpacity, Platform, Dimensions, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import * as Location from "expo-location";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveInspection, type InspectionLocation } from "@/lib/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = 200;

export default function SignatureScreen() {
  const colors = useColors();
  const router = useRouter();
  const { inspectionData } = useLocalSearchParams<{ inspectionData: string }>();
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "acquired" | "denied" | "error">("pending");
  const [location, setLocation] = useState<InspectionLocation | undefined>(undefined);

  const hasSignature = paths.length > 0 || currentPath.length > 0;

  // Request GPS location on mount
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "web" && !window.navigator.geolocation) {
          setGpsStatus("error");
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setGpsStatus("denied");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? undefined,
        });
        setGpsStatus("acquired");
      } catch {
        setGpsStatus("error");
      }
    })();
  }, []);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      const x = Math.min(Math.max(e.x, 0), CANVAS_WIDTH);
      const y = Math.min(Math.max(e.y, 0), CANVAS_HEIGHT);
      setCurrentPath(`M${x},${y}`);
    })
    .onUpdate((e) => {
      const x = Math.min(Math.max(e.x, 0), CANVAS_WIDTH);
      const y = Math.min(Math.max(e.y, 0), CANVAS_HEIGHT);
      setCurrentPath((prev) => `${prev} L${x},${y}`);
    })
    .onEnd(() => {
      if (currentPath) {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath("");
      }
    });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath("");
  };

  const handleSubmit = async () => {
    if (!inspectionData || !hasSignature) return;

    // Warn if GPS not acquired
    if (gpsStatus !== "acquired") {
      Alert.alert(
        "GPS Not Available",
        "Location data could not be captured. The inspection will still be saved without GPS coordinates. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => doSubmit() },
        ]
      );
      return;
    }

    doSubmit();
  };

  const doSubmit = async () => {
    setSubmitting(true);

    try {
      const inspection = JSON.parse(inspectionData);
      // Store signature as SVG path data (lightweight)
      inspection.signatureBase64 = JSON.stringify([...paths, currentPath].filter(Boolean));
      // Record exact timestamp at moment of submission
      inspection.timestamp = new Date().toISOString();
      // Attach GPS location
      if (location) {
        inspection.location = location;
      }

      const saved = await saveInspection(inspection);

      if (Platform.OS !== "web") {
        const Haptics = await import("expo-haptics");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.replace({
        pathname: "/inspection-complete" as any,
        params: { inspectionId: saved.id, cleared: inspection.cleared ? "true" : "false" },
      });
    } catch (e) {
      setSubmitting(false);
      Alert.alert("Error", "Failed to save inspection. Please try again.");
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2" edges={["top", "bottom", "left", "right"]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
          Digital Signature
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>
          Sign below to verify accountability and submit the inspection
        </Text>

        {/* WorkSafe Compliance Info */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Auto-Recorded Compliance Data
          </Text>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="access-time" size={14} color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                Timestamp: {new Date().toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons
                name="location-on"
                size={14}
                color={gpsStatus === "acquired" ? colors.success : gpsStatus === "pending" ? colors.warning : colors.error}
              />
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                GPS:{" "}
                {gpsStatus === "acquired" && location
                  ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                  : gpsStatus === "pending"
                  ? "Acquiring..."
                  : gpsStatus === "denied"
                  ? "Permission denied"
                  : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        {/* Signature Canvas */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            height: CANVAS_HEIGHT,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: hasSignature ? colors.primary + "60" : colors.border,
            borderStyle: hasSignature ? "solid" : "dashed",
            marginBottom: 12,
          }}
        >
          <GestureDetector gesture={pan}>
            <View style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                {paths.map((p, i) => (
                  <Path key={i} d={p} stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {currentPath ? (
                  <Path d={currentPath} stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ) : null}
              </Svg>
            </View>
          </GestureDetector>
        </View>

        {/* Clear button */}
        <TouchableOpacity
          onPress={handleClear}
          activeOpacity={0.7}
          style={{ alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 12 }}
        >
          <Text style={{ fontSize: 14, color: colors.error, fontWeight: "600" }}>Clear</Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!hasSignature || submitting}
          style={{
            backgroundColor: hasSignature ? colors.primary : colors.muted + "30",
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginBottom: 16,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <MaterialIcons name="check-circle" size={22} color={hasSignature ? "#1A1A1A" : colors.muted} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: hasSignature ? "#1A1A1A" : colors.muted }}>
            {submitting ? "Submitting..." : "Submit Inspection"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
