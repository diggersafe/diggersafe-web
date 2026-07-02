import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

function TabIcon({ name, label, focused }: { name: any; label: string; focused: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.tabButton,
        {
          backgroundColor: focused ? colors.primary : colors.primary + "20",
          borderWidth: focused ? 0 : 1.5,
          borderColor: focused ? "transparent" : colors.primary + "50",
        },
      ]}
    >
      <IconSymbol size={18} name={name} color={focused ? "#1A1A1A" : colors.primary} />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? "#1A1A1A" : colors.primary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);
  const tabBarHeight = 72 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1A1A1A",
        tabBarInactiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: bottomPadding,
          paddingHorizontal: 16,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border + "40",
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Fleet",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="car.fill" label="FLEET" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inspect"
        options={{
          title: "Inspect",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clipboard.fill" label="INSPECT" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clock.fill" label="HISTORY" focused={focused} />
          ),
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

const styles = StyleSheet.create({
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    minWidth: 100,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

