import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
          Privacy Policy
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 24 }}>
          Last updated: June 2026
        </Text>

        <Section title="1. Information We Collect" colors={colors}>
          DiggerSafe collects the following information to provide our fleet inspection service:{"\n\n"}
          {"\u2022"} Operator name and company name{"\n"}
          {"\u2022"} Machine details (asset ID, make/model, serial number){"\n"}
          {"\u2022"} Inspection records including safety check results{"\n"}
          {"\u2022"} Digital signatures captured during inspections{"\n"}
          {"\u2022"} GPS location at time of inspection submission{"\n"}
          {"\u2022"} Photos taken as evidence during inspections{"\n"}
          {"\u2022"} Engine hour meter readings
        </Section>

        <Section title="2. How We Use Your Information" colors={colors}>
          Your information is used exclusively to:{"\n\n"}
          {"\u2022"} Generate WorkSafe-compliant inspection reports{"\n"}
          {"\u2022"} Track machine maintenance and inspection history{"\n"}
          {"\u2022"} Provide GPS and timestamp verification for compliance{"\n"}
          {"\u2022"} Enable report sharing via email or other methods
        </Section>

        <Section title="3. Data Storage" colors={colors}>
          All data is stored locally on your device using encrypted storage. We do not transmit your inspection data to external servers unless you explicitly choose to share a report via email or other sharing methods.
        </Section>

        <Section title="4. Data Sharing" colors={colors}>
          We do not sell, trade, or share your personal information with third parties. Inspection reports are only shared when you explicitly initiate sharing through the app's share function.
        </Section>

        <Section title="5. Data Retention & Deletion" colors={colors}>
          Your data remains on your device until you choose to delete it. You can delete all app data at any time through Settings {">"} Delete All Data. Uninstalling the app will also remove all locally stored data.
        </Section>

        <Section title="6. GPS & Location Data" colors={colors}>
          Location data is collected only at the moment of inspection submission to provide WorkSafe-compliant location verification. We do not track your location in the background or at any other time.
        </Section>

        <Section title="7. Camera & Photos" colors={colors}>
          The camera is used solely to capture evidence photos during inspections when a safety check item fails. Photos are stored locally on your device as part of the inspection record.
        </Section>

        <Section title="8. Your Rights" colors={colors}>
          You have the right to:{"\n\n"}
          {"\u2022"} Access all data stored by the app{"\n"}
          {"\u2022"} Export your inspection records as PDF{"\n"}
          {"\u2022"} Delete all your data at any time{"\n"}
          {"\u2022"} Withdraw consent for location access via device settings
        </Section>

        <Section title="9. Contact Us" colors={colors}>
          If you have questions about this privacy policy, contact us at:{"\n\n"}
          support@diggersafe.com.au
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  );
}

