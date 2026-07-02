import { useCallback, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Path } from "react-native-svg";
// Print and Sharing loaded dynamically to prevent crash in production

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getInspections, INSPECTION_PHASES, type Inspection } from "@/lib/store";

function generateReportHTML(inspection: Inspection): string {
  const dateStr = new Date(inspection.date).toLocaleDateString("en-AU", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const timeStr = inspection.timestamp
    ? new Date(inspection.timestamp).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "N/A";

  let signatureSvg = "";
  try {
    const paths = JSON.parse(inspection.signatureBase64) as string[];
    signatureSvg = paths.map(p => `<path d="${p}" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`).join("");
  } catch {}

  const checksHTML = INSPECTION_PHASES.map((phase) => {
    const phaseChecks = inspection.checks.filter((c) => c.phase === phase.id);
    if (phaseChecks.length === 0) return "";
    return `
      <h3 style="color:#E8B100;margin:16px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${phase.title}</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${phaseChecks.map(check => `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#333;">${check.category}</td>
            <td style="padding:6px 0;text-align:right;">
              <span style="background:${check.result === "pass" ? "#e6f9e6" : "#fde8e8"};color:${check.result === "pass" ? "#22C55E" : "#EF4444"};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">
                ${check.result === "pass" ? "Pass" : "Fail"}
              </span>
            </td>
          </tr>
          ${check.result === "fail" && check.notes ? `<tr><td colspan="2" style="padding:2px 0 8px 12px;font-size:11px;color:#EF4444;font-style:italic;">Note: ${check.notes}</td></tr>` : ""}
        `).join("")}
      </table>
    `;
  }).join("");

  return `
    <html>
    <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
      <div style="display:flex;align-items:center;margin-bottom:20px;">
        <div>
          <h1 style="margin:0;font-size:20px;"><span style="color:#22C55E;">Digger</span>Safe</h1>
          <p style="margin:0;font-size:10px;color:#666;letter-spacing:1.5px;text-transform:uppercase;">Fleet & Safety</p>
        </div>
        <div style="margin-left:auto;background:${inspection.cleared ? "#e6f9e6" : "#fde8e8"};padding:4px 12px;border-radius:6px;">
          <span style="font-size:12px;font-weight:700;color:${inspection.cleared ? "#22C55E" : "#EF4444"};">${inspection.cleared ? "CLEARED" : "GROUNDED"}</span>
        </div>
      </div>

      <table style="width:100%;margin-bottom:16px;">
        <tr><td style="font-size:11px;color:#666;text-transform:uppercase;">Asset ID</td><td style="font-size:11px;color:#666;text-transform:uppercase;">Make/Model</td></tr>
        <tr><td style="font-size:15px;font-weight:600;padding-bottom:8px;">${inspection.assetId}</td><td style="font-size:15px;padding-bottom:8px;">${inspection.makeModel}</td></tr>
        <tr><td style="font-size:11px;color:#666;text-transform:uppercase;">Date</td><td style="font-size:11px;color:#666;text-transform:uppercase;">Operator</td></tr>
        <tr><td style="font-size:15px;padding-bottom:8px;">${dateStr}</td><td style="font-size:15px;padding-bottom:8px;">${inspection.operator}</td></tr>
        <tr><td style="font-size:11px;color:#666;text-transform:uppercase;">Hour Meter</td><td></td></tr>
        <tr><td style="font-size:18px;font-weight:700;font-family:monospace;">${inspection.hourMeter} hrs</td><td></td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">

      ${checksHTML}

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">

      <h3 style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Safe Work Compliance</h3>
      <p style="font-size:12px;margin:4px 0;">Submitted: ${dateStr} at ${timeStr}</p>
      <p style="font-size:12px;margin:4px 0;">GPS: ${inspection.location ? `${inspection.location.latitude.toFixed(5)}, ${inspection.location.longitude.toFixed(5)}` : "Not recorded"}</p>
      <p style="font-size:12px;margin:4px 0;">Hour Meter: ${inspection.hourMeter} hrs</p>

      ${inspection.groundedReason ? `
        <div style="background:#fde8e8;border:1px solid #f87171;border-radius:8px;padding:12px;margin:16px 0;">
          <p style="font-size:11px;font-weight:700;color:#EF4444;margin:0 0 4px;">GROUNDED — REASON:</p>
          <p style="font-size:12px;color:#EF4444;margin:0;">${inspection.groundedReason}</p>
        </div>
      ` : ""}

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">

      <h3 style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Signature</h3>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px;height:100px;">
        <svg width="100%" height="100">${signatureSvg}</svg>
      </div>

      <p style="font-size:10px;color:#999;text-align:center;margin-top:24px;">Generated by DiggerSafe Fleet & Safety</p>
    </body>
    </html>
  `;
}

export default function ReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inspection, setInspection] = useState<Inspection | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const inspections = await getInspections();
        const found = inspections.find((i) => i.id === id);
        setInspection(found || null);
      })();
    }, [id])
  );

  if (!inspection) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground }}>Loading...</Text>
      </ScreenContainer>
    );
  }

  const dateStr = new Date(inspection.date).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeStr = inspection.timestamp
    ? new Date(inspection.timestamp).toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "N/A";

  let signaturePaths: string[] = [];
  try {
    signaturePaths = JSON.parse(inspection.signatureBase64);
  } catch {}

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>

        {/* Report Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Branding Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <MaterialIcons name="construction" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                <Text style={{ color: colors.success }}>Digger</Text>Safe
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, letterSpacing: 1 }}>FLEET & SAFETY</Text>
            </View>
            <View style={{ flex: 1 }} />
            {/* Status badge */}
            <View
              style={{
                backgroundColor: inspection.cleared ? colors.success + "20" : colors.error + "20",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: inspection.cleared ? colors.success : colors.error,
                }}
              >
                {inspection.cleared ? "CLEARED" : "GROUNDED"}
              </Text>
            </View>
          </View>

          {/* Inspection Summary */}
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Asset ID
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>
                {inspection.assetId}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Make/Model
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground, marginTop: 2 }}>
                {inspection.makeModel}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Date
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground, marginTop: 2 }}>
                {dateStr}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Operator
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground, marginTop: 2 }}>
                {inspection.operator}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
              Hour Meter
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 2, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
              {inspection.hourMeter} hrs
            </Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

          {/* Safety Checks by Phase */}
          {INSPECTION_PHASES.map((phase) => {
            const phaseChecks = inspection.checks.filter((c) => c.phase === phase.id);
            if (phaseChecks.length === 0) return null;

            return (
              <View key={phase.id} style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.primary,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  {phase.title}
                </Text>

                {phaseChecks.map((check, index) => (
                  <View key={index}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
                        {check.category}
                      </Text>
                      <View
                        style={{
                          backgroundColor: check.result === "pass" ? colors.success + "20" : colors.error + "20",
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: check.result === "pass" ? colors.success : colors.error,
                          }}
                        >
                          {check.result === "pass" ? "Pass" : "Fail"}
                        </Text>
                      </View>
                    </View>
                    {check.result === "fail" && check.notes ? (
                      <View
                        style={{
                          backgroundColor: colors.error + "10",
                          borderRadius: 6,
                          padding: 8,
                          marginBottom: 4,
                          marginLeft: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: colors.error, fontStyle: "italic" }}>
                          {check.notes}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            );
          })}

          {/* Fallback for old inspections without phase data */}
          {inspection.checks.every((c) => !c.phase) && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 }}>
                Safety Checks
              </Text>
              {inspection.checks.map((check, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
                    {check.category}
                  </Text>
                  <View
                    style={{
                      backgroundColor: check.result === "pass" ? colors.success + "20" : colors.error + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: check.result === "pass" ? colors.success : colors.error,
                      }}
                    >
                      {check.result === "pass" ? "Pass" : "Fail"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

          {/* Safe Work Compliance Data */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 }}>
            Safe Work Compliance
          </Text>

          <View style={{ gap: 6, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="access-time" size={14} color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                Submitted: {dateStr} at {timeStr}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="location-on" size={14} color={inspection.location ? colors.success : colors.muted} />
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                GPS:{" "}
                {inspection.location
                  ? `${inspection.location.latitude.toFixed(5)}, ${inspection.location.longitude.toFixed(5)}`
                  : "Not recorded"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="speed" size={14} color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                Hour Meter: {inspection.hourMeter} hrs
              </Text>
            </View>
          </View>

          {/* Grounded reason */}
          {inspection.groundedReason && (
            <View
              style={{
                backgroundColor: colors.error + "10",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.error + "30",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.error, marginBottom: 4 }}>
                GROUNDED — REASON:
              </Text>
              <Text style={{ fontSize: 12, color: colors.error, lineHeight: 18 }}>
                {inspection.groundedReason}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

          {/* Signature */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 }}>
            Signature
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              height: 120,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Svg width="100%" height={120}>
              {signaturePaths.map((p, i) => (
                <Path key={i} d={p} stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </Svg>
          </View>
        </View>

        {/* Share / Email Report */}
        <TouchableOpacity
          onPress={async () => {
            if (!inspection) return;
            try {
              const Print = await import("expo-print");
              const Sharing = await import("expo-sharing");
              const html = generateReportHTML(inspection);
              const { uri } = await Print.printToFileAsync({ html, base64: false });
              if (Platform.OS === "web") {
                await Print.printAsync({ html });
              } else {
                await Sharing.shareAsync(uri, {
                  mimeType: "application/pdf",
                  dialogTitle: `DiggerSafe Report - ${inspection.assetId}`,
                  UTI: "com.adobe.pdf",
                });
              }
            } catch (e: any) {
              Alert.alert("Share Report", "Report sharing will be available in the next update. You can take a screenshot of this report for now.");
            }
          }}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 20,
          }}
        >
          <MaterialIcons name="share" size={20} color="#1A1A1A" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A" }}>Share / Email Report</Text>
        </TouchableOpacity>

        {/* Back to Fleet */}
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)" as any)}
          activeOpacity={0.7}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.foreground} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>Back to Fleet</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
