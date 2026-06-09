import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/hooks/use-subscription";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    machines: "Up to 2 machines",
    monthlyPrice: "$4.99",
    yearlyPrice: "$49",
    yearlySaving: "Save 18%",
    limit: 2,
  },
  {
    id: "basic",
    name: "Basic",
    machines: "Up to 10 machines",
    monthlyPrice: "$9.99",
    yearlyPrice: "$89",
    yearlySaving: "Save 26%",
    limit: 10,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    machines: "Unlimited machines",
    monthlyPrice: "$24.99",
    yearlyPrice: "$199",
    yearlySaving: "Save 33%",
    limit: Infinity,
  },
];

const FEATURES = [
  { icon: "assignment", text: "WorkSafe pre-hire inspections" },
  { icon: "build", text: "Service records & maintenance logs" },
  { icon: "cloud-upload", text: "Cloud backup — never lose records" },
  { icon: "picture-as-pdf", text: "Generate & share PDF reports" },
  { icon: "qr-code", text: "QR sticker generation" },
  { icon: "gps-fixed", text: "GPS & timestamp compliance logging" },
];

export default function SubscribeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { status, daysRemaining, refresh } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const handleSubscribe = async () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    const price = billingCycle === "monthly" ? plan?.monthlyPrice : plan?.yearlyPrice;
    const period = billingCycle === "monthly" ? "month" : "year";

    if (Platform.OS === "web") {
      Alert.alert(
        "Subscribe via App",
        "Subscriptions are managed through the Apple App Store or Google Play Store. Please subscribe using the DiggerSafe app on your mobile device.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      `Subscribe to ${plan?.name}`,
      `In the released version, this will open the native payment sheet via Apple StoreKit (iOS) or Google Play Billing (Android).\n\n${plan?.name}: ${price}/${period} — ${plan?.machines}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Simulate Purchase",
          onPress: async () => {
            try {
              if (Platform.OS !== "web") {
                const Haptics = await import("expo-haptics");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert(
                "Subscription Activated",
                `Your DiggerSafe ${plan?.name} subscription is now active. Thank you!`,
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
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {/* Back Button */}
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
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <MaterialIcons name="verified" size={36} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
              Choose Your Plan
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
              All plans include a 14-day free trial.{"\n"}Cancel anytime.
            </Text>
          </View>

          {/* Billing Toggle */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={() => setBillingCycle("monthly")}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: billingCycle === "monthly" ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: billingCycle === "monthly" ? "#1A1A1A" : colors.muted,
                }}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingCycle("yearly")}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: billingCycle === "yearly" ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: billingCycle === "yearly" ? "#1A1A1A" : colors.muted,
                }}
              >
                Yearly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Plan Cards */}
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 12,
                  borderWidth: isSelected ? 2.5 : 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  position: "relative",
                }}
              >
                {plan.popular && (
                  <View
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      backgroundColor: colors.primary,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#1A1A1A" }}>
                      MOST POPULAR
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                      {plan.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                      {plan.machines}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>
                      {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </Text>
                    {billingCycle === "yearly" && (
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.success, marginTop: 2 }}>
                        {plan.yearlySaving}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Selection indicator */}
                <View
                  style={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected && (
                    <MaterialIcons name="check" size={14} color="#1A1A1A" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Trial badge */}
          <View
            style={{
              backgroundColor: colors.primary + "15",
              borderRadius: 10,
              paddingVertical: 8,
              paddingHorizontal: 14,
              alignSelf: "center",
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
              14-DAY FREE TRIAL ON ALL PLANS
            </Text>
          </View>

          {/* Features List */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
              All Plans Include
            </Text>
            {FEATURES.map((feature, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 9,
                  borderBottomWidth: idx < FEATURES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border + "40",
                }}
              >
                <MaterialIcons name={feature.icon as any} size={20} color={colors.success} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 14, color: colors.foreground, flex: 1 }}>{feature.text}</Text>
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
              No charge for 14 days • Cancel anytime
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
              Your existing records remain accessible in read-only mode. You can view past inspections and machine details but won't be able to create new inspections or add machines.
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
