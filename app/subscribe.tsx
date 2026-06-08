import { Text, View, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";

const FEATURES = [
  { icon: "add-circle", text: "Add unlimited machines to your fleet" },
  { icon: "assignment", text: "Run WorkSafe pre-hire inspections" },
  { icon: "build", text: "Log service records and maintenance" },
  { icon: "cloud-upload", text: "Cloud backup — never lose records" },
  { icon: "picture-as-pdf", text: "Generate and share PDF reports" },
  { icon: "qr-code", text: "QR sticker generation for machines" },
  { icon: "gps-fixed", text: "GPS & timestamp compliance logging" },
];

export default function SubscribeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { status, daysRemaining, refresh } = useSubscription();
  const { isAuthenticated } = useAuth();

  const handleSubscribe = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Subscribe via App",
        "Subscriptions are managed through the Apple App Store or Google Play Store. Please subscribe using the DiggerSafe app on your mobile device.",
        [{ text: "OK" }]
      );
      return;
    }

    // In production, this would trigger Apple StoreKit or Google Play Billing
    // For now, show a placeholder that explains the IAP flow
    Alert.alert(
      "Subscribe to DiggerSafe Pro",
      "In the released version, this will open the native payment sheet via Apple StoreKit (iOS) or Google Play Billing (Android).\n\nSubscription: $9.99/month or $89.99/year",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Simulate Purchase",
          onPress: async () => {
            // Simulate a successful purchase for development/testing
            try {
              if (Platform.OS !== "web") {
                const Haptics = await import("expo-haptics");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert(
                "Subscription Activated",
                "Your DiggerSafe Pro subscription is now active. Thank you for subscribing!",
                [{ text: "Continue", onPress: () => router.back() }]
              );
              await refresh();
            } catch {
              Alert.alert("Error", "Failed to process subscription. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleRestorePurchase = () => {
    Alert.alert(
      "Restore Purchase",
      "In the released version, this will check your Apple/Google account for existing subscriptions and restore them automatically.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ marginBottom: 20 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>

          {/* Status Banner */}
          {status === "expired" && (
            <View
              style={{
                backgroundColor: colors.error + "15",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.error + "30",
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <MaterialIcons name="warning" size={20} color={colors.error} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.error }}>
                  Subscription Expired
                </Text>
                <Text style={{ fontSize: 12, color: colors.error + "CC", marginTop: 2 }}>
                  Your records are safe but read-only. Subscribe to resume inspections.
                </Text>
              </View>
            </View>
          )}

          {status === "trial" && daysRemaining !== null && (
            <View
              style={{
                backgroundColor: colors.warning + "15",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.warning + "30",
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <MaterialIcons name="timer" size={20} color={colors.warning} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.warning }}>
                  Trial: {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                </Text>
                <Text style={{ fontSize: 12, color: colors.warning + "CC", marginTop: 2 }}>
                  Subscribe now to keep full access after your trial ends.
                </Text>
              </View>
            </View>
          )}

          {/* Hero */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <MaterialIcons name="verified" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
              DiggerSafe Pro
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 22 }}>
              Full access to WorkSafe-compliant fleet inspections, cloud backup, and unlimited machines.
            </Text>
          </View>

          {/* Pricing */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 2,
              borderColor: colors.primary,
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginBottom: 4 }}>
              <Text style={{ fontSize: 36, fontWeight: "800", color: colors.foreground }}>$9.99</Text>
              <Text style={{ fontSize: 15, color: colors.muted, marginLeft: 4 }}>/month</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
              or $89.99/year (save 25%)
            </Text>
            <View
              style={{
                marginTop: 12,
                backgroundColor: colors.primary + "15",
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                alignSelf: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                14-DAY FREE TRIAL
              </Text>
            </View>
          </View>

          {/* Features List */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
              What's Included
            </Text>
            {FEATURES.map((feature, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: idx < FEATURES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border + "40",
                }}
              >
                <MaterialIcons name={feature.icon as any} size={22} color={colors.success} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: colors.foreground, flex: 1 }}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handleSubscribe}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 14,
              padding: 18,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#1A1A1A" }}>
              Start Free Trial
            </Text>
            <Text style={{ fontSize: 12, color: "#1A1A1A" + "AA", marginTop: 2 }}>
              No charge for 14 days
            </Text>
          </TouchableOpacity>

          {/* Restore Purchase */}
          <TouchableOpacity
            onPress={handleRestorePurchase}
            activeOpacity={0.7}
            style={{
              borderRadius: 14,
              padding: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
              Restore Purchase
            </Text>
          </TouchableOpacity>

          {/* Read-only mode explanation */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              What happens if I don't subscribe?
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
              Your existing records remain accessible in read-only mode. You can view past inspections, reports, and machine details. You just won't be able to create new inspections or add machines until you subscribe.
            </Text>
          </View>

          {/* Legal */}
          <Text style={{ fontSize: 11, color: colors.muted + "80", textAlign: "center", lineHeight: 16 }}>
            Payment will be charged to your Apple ID or Google Play account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your device settings.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
