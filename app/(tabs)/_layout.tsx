import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);
  const tabBarHeight = 68 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1A1A1A",
        tabBarInactiveTintColor: "#1A1A1A99",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.primary,
          borderTopColor: colors.primary,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Fleet",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="construction" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inspect"
        options={{
          title: "Inspect",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clipboard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
        }}
      />
      {/* Hide settings from tab bar - accessible from Fleet header */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
