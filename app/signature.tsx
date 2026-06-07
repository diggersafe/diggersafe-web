import { useRef, useState } from "react";
import { Text, View, TouchableOpacity, Platform, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedProps, runOnJS } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveInspection } from "@/lib/store";

const AnimatedPath = Animated.createAnimatedComponent(Path);
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

  const hasSignature = paths.length > 0 || currentPath.length > 0;

  const updateCurrentPath = (path: string) => {
    setCurrentPath(path);
  };

  const finishPath = (path: string) => {
    if (path) {
      setPaths((prev) => [...prev, path]);
      setCurrentPath("");
    }
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      const x = Math.min(Math.max(e.x, 0), CANVAS_WIDTH);
      const y = Math.min(Math.max(e.y, 0), CANVAS_HEIGHT);
      updateCurrentPath(`M${x},${y}`);
    })
    .onUpdate((e) => {
      const x = Math.min(Math.max(e.x, 0), CANVAS_WIDTH);
      const y = Math.min(Math.max(e.y, 0), CANVAS_HEIGHT);
      setCurrentPath((prev) => `${prev} L${x},${y}`);
    })
    .onEnd(() => {
      finishPath(currentPath);
    });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath("");
  };

  const handleSubmit = async () => {
    if (!inspectionData || !hasSignature) return;
    setSubmitting(true);

    try {
      const inspection = JSON.parse(inspectionData);
      // Store signature as SVG path data (lightweight)
      inspection.signatureBase64 = JSON.stringify([...paths, currentPath].filter(Boolean));

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
          Signature
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          Sign below to confirm the inspection
        </Text>

        {/* Signature Canvas */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            height: CANVAS_HEIGHT,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: colors.border,
            borderStyle: "dashed",
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
