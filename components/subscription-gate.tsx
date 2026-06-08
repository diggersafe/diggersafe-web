import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useSubscription, canPerformWriteOps } from "@/hooks/use-subscription";

/**
 * A banner component that shows when the user's subscription has expired.
 * Displays a warning and a CTA to subscribe.
 */
export function SubscriptionExpiredBanner() {
  const colors = useColors();
  const router = useRouter();
  const subscription = useSubscription();

  if (subscription.loading || canPerformWriteOps(subscription)) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => router.push("/subscribe" as any)}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.error + "12",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.error + "30",
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <MaterialIcons name="lock" size={20} color={colors.error} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.error }}>
          Read-Only Mode
        </Text>
        <Text style={{ fontSize: 12, color: colors.error + "CC", marginTop: 2 }}>
          Subscribe to create inspections and add machines.
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.error} />
    </TouchableOpacity>
  );
}

/**
 * Hook that returns whether write operations are allowed.
 * Use this to conditionally disable buttons or redirect to paywall.
 */
export function useWriteAccess() {
  const subscription = useSubscription();
  const router = useRouter();

  const isAllowed = canPerformWriteOps(subscription);

  const guardAction = (action: () => void) => {
    if (isAllowed) {
      action();
    } else {
      router.push("/subscribe" as any);
    }
  };

  return {
    isAllowed,
    guardAction,
    isLoading: subscription.loading,
  };
}
