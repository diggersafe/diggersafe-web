import { Text, View, Platform, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

interface AppHeaderProps {
  showSettings?: boolean;
}

export function AppHeader({ showSettings = false }: AppHeaderProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 54 : 40,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            marginRight: 10,
          }}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
            <Text style={{ color: colors.success }}>Digger</Text>Safe
          </Text>
          <Text style={{ fontSize: 10, color: colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Fleet & Safety
          </Text>
        </View>
        {showSettings && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings" as any)}
            activeOpacity={0.7}
            style={{ padding: 8 }}
          >
            <MaterialIcons name="settings" size={22} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
