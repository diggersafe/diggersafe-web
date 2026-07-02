import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSubscription, ALL_PRODUCT_IDS, PRODUCT_IDS } from "@/hooks/use-subscription";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    machines: "Up to 2 machines",
    monthlyPrice: "$7.99",
    yearlyPrice: "$69.99",
    yearlySaving: "Save 18%",
    monthlyProductId: PRODUCT_IDS.starter_monthly,
    yearlyProductId: PRODUCT_IDS.starter_yearly,
    limit: 2,
  },
  {
    id: "basic",
    name: "Basic",
    machines: "Up to 10 machines",
    monthlyPrice: "$19.99",
    yearlyPrice: "$179.99",
    yearlySaving: "Save 26%",
    monthlyProductId: PRODUCT_IDS.basic_monthly,
    yearlyProductId: PRODUCT_IDS.basic_yearly,
    limit: 10,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    machines: "Unlimited machines",
    monthlyPrice: "$49.99",
    yearlyPrice: "$399.99",
    yearlySaving: "Save 33%",
    monthlyProductId: PRODUCT_IDS.pro_monthly,
    yearlyProductId: PRODUCT_IDS.pro_yearly,
    limit: Infinity,
  },
];

const FEATURES = [
  { icon: "assignment", text: "WorkSafe Pre-Start inspections" },
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
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // ✅ REAL StoreKit purchase handler - no more "Simulate Purchase"
  const handleSubscribe = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Subscribe via App",
        "Please subscribe using the DiggerSafe app on your iOS or Android device.",
        [{ text: "OK" }]
      );
      return;
    }

    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    const productId = billingCycle === "yearly" ? plan.yearlyProductId : plan.monthlyProductId;

    setPurchasing(true);
    try {
      const {
        initConnection,
        requestSubscription,
        purchaseErrorListener,
        purchaseUpdatedListener,
        finishTransaction,
      } = await import("react-native-iap");

      await initConnection();

      await new Promise<void>((resolve, reject) => {
        const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
          if (purchase.productId === productId) {
            try {
              await finishTransaction({ purchase, isConsumable: false });
              purchaseUpdateSubscription.remove();
              purchaseErrorSubscription.remove();
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        });

        const purchaseErrorSubscription = purchaseErrorListener((error) => {
          purchaseUpdateSubscription.remove();
          purchaseErrorSubscription.remove();
          reject(error);
        });

        requestSubscription({ sku: productId }).catch(reject);
      });

      await refresh();
      Alert.alert(
        "Subscription Activated! ✅",
        `Welcome to DiggerSafe ${plan.name}! Your subscription is now active.`,
        [{ text: "Let's Go!", onPress: () => router.back() }]
      );
    } catch (error: any) {
      if (error?.code !== "E_USER_CANCELLED") {
        Alert.alert("Purchase Failed", "Something went wrong. Please try again or contact support.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  // ✅ REAL restore purchases handler
  const handleRestorePurchase = async () => {
    if (Platform.OS === "web") return;
    setRestoring(true);
    try {
      const { initConnection, getAvailablePurchases } = await import("react-native-iap");
      await initConnection();
      const purchases = await getAvailablePurchases();
      const validPurchase = purchases.find((p) =>
        ALL_PRODUCT_IDS.includes(p.productId as any)
      );
      if (validPurchase) {
        await refresh();
        Alert.alert("Purchase Restored ✅", "Your subscription has been restored.", [
          { text: "Continue", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("No Purchase Found", "No active DiggerSafe subscription was found on this Apple ID.");
      }
    } catch {
      Alert.alert("Restore Failed", "Could not restore purchase. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginBottom: 20 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>

          {/* Status Banners */}
          {status === "expired" && (
            <View style={{ backgroundColor: colors.error + "15", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.error + "30", marginBottom: 20, flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="warning" size={20} color={colors.error} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.error }}>Subscription Expired</Text>
                <Text style={{ fontSize: 12, color: colors.error + "CC", marginTop: 2 }}>Your records are safe but read-only. Subscribe to resume inspections.</Text>
              </View>
            </View>
          )}

          {status === "trial" && daysRemaining !== null && (
            <View style={{ backgroundColor: colors.warning + "15", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.warning + "30", marginBottom: 20, flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="timer" size={20} color={colors.warning} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.warning }}>Trial: {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining</Text>
                <Text style={{ fontSize: 12, color: colors.warning + "CC", marginTop: 2 }}>Subscribe now to keep full access after your trial ends.</Text>
              </View>
            </View>
          )}

          {/* Hero */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <MaterialIcons name="verified" size={36} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>Choose Your Plan</Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20 }}>All plans include a 14-day free trial.{"\n"}Cancel anytime.</Text>
          </View>

          {/* Billing Toggle */}
          <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <TouchableOpacity onPress={() => setBillingCycle("monthly")} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: billingCycle === "monthly" ? colors.primary : "transparent" }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: billingCycle === "monthly" ? "#1A1A1A" : colors.muted }}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBillingCycle("yearly")} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: billingCycle === "yearly" ? colors.primary : "transparent" }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: billingCycle === "yearly" ? "#1A1A1A" : colors.muted }}>Yearly</Text>
            </TouchableOpacity>
          </View>

          {/* Plan Cards */}
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.7} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: isSelected ? 2.5 : 1, borderColor: isSelected ? colors.primary : colors.border, position: "relative" }}>
                {plan.popular && (
                  <View style={{ position: "absolute", top: -10, right: 16, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#1A1A1A" }}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingLeft: 28 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{plan.name}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{plan.machines}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>{billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>/{billingCycle === "monthly" ? "month" : "year"}</Text>
                    {billingCycle === "yearly" && <Text style={{ fontSize: 11, fontWeight: "600", color: colors.success, marginTop: 2 }}>{plan.yearlySaving}</Text>}
                  </View>
                </View>
                <View style={{ position: "absolute", top: 18, left: 18, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {isSelected && <MaterialIcons name="check" size={14} color="#1A1A1A" />}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Trial badge */}
          <View style={{ backgroundColor: colors.primary + "15", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "center", marginTop: 4, marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>14-DAY FREE TRIAL ON ALL PLANS</Text>
          </View>

          {/* Features */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>All Plans Include</Text>
            {FEATURES.map((feature, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: idx < FEATURES.length - 1 ? 1 : 0, borderBottomColor: colors.border + "40" }}>
                <MaterialIcons name={feature.icon as any} size={20} color={colors.success} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 14, color: colors.foreground, flex: 1 }}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* ✅ Subscribe Button - triggers REAL Apple payment sheet */}
          <TouchableOpacity
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={purchasing}
            style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 18, alignItems: "center", marginBottom: 12, opacity: purchasing ? 0.7 : 1 }}
          >
            {purchasing ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <>
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#1A1A1A" }}>Start Free Trial</Text>
                <Text style={{ fontSize: 12, color: "#1A1A1A" + "AA", marginTop: 2 }}>No charge for 14 days • Cancel anytime</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ✅ Restore Purchase - triggers REAL restore */}
          <TouchableOpacity
            onPress={handleRestorePurchase}
            activeOpacity={0.7}
            disabled={restoring}
            style={{ borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginBottom: 20, opacity: restoring ? 0.7 : 1 }}
          >
            {restoring ? (
              <ActivityIndicator color={colors.foreground} />
            ) : (
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>Restore Purchase</Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          <Text style={{ fontSize: 11, color: colors.muted + "80", textAlign: "center", lineHeight: 16 }}>
            Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage or cancel subscriptions in your device Settings after purchase.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

