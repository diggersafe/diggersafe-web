import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function TermsOfServiceScreen() {
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
          Terms of Service
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 24 }}>
          Last updated: June 2026
        </Text>

        <Section title="1. Acceptance of Terms" colors={colors}>
          By downloading, installing, or using DiggerSafe ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.
        </Section>

        <Section title="2. Description of Service" colors={colors}>
          DiggerSafe is a digital tool designed to assist operators in conducting Pre-Start safety inspections of earthmoving and construction equipment. The App generates digital inspection records that may assist with WorkSafe compliance documentation.
        </Section>

        <Section title="3. Disclaimer of Liability" colors={colors}>
          DiggerSafe is a record-keeping tool only. The App does not:{"\n\n"}
          {"\u2022"} Replace qualified safety inspections by certified professionals{"\n"}
          {"\u2022"} Guarantee compliance with any specific WorkSafe regulations{"\n"}
          {"\u2022"} Certify that equipment is safe to operate{"\n"}
          {"\u2022"} Provide legal or safety advice{"\n\n"}
          The operator remains solely responsible for ensuring equipment is safe before use. DiggerSafe accepts no liability for accidents, injuries, or regulatory non-compliance.
        </Section>

        <Section title="4. Subscription & Payment" colors={colors}>
          {"\u2022"} Access to DiggerSafe requires an active subscription{"\n"}
          {"\u2022"} Subscriptions are billed through the Apple App Store
          {"\u2022"} Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period{"\n"}
          {"\u2022"} If your subscription lapses, you retain read-only access to existing records but cannot create new inspections{"\n"}
          {"\u2022"} Refunds are handled by Apple according to their policies.
        </Section>

        <Section title="5. User Responsibilities" colors={colors}>
          You agree to:{"\n\n"}
          {"\u2022"} Provide accurate information during inspections{"\n"}
          {"\u2022"} Not use the App as a substitute for proper safety training{"\n"}
          {"\u2022"} Maintain the security of your device and app data{"\n"}
          {"\u2022"} Comply with all applicable workplace health and safety laws
        </Section>

        <Section title="6. Intellectual Property" colors={colors}>
          All content, design, and functionality of DiggerSafe is owned by DiggerSafe Pty Ltd and is protected by Australian and international copyright laws. You may not reproduce, distribute, or create derivative works from any part of the App.
        </Section>

        <Section title="7. Data & Privacy" colors={colors}>
          Your use of the App is also governed by our Privacy Policy. By using the App, you consent to the collection and use of information as described in the Privacy Policy.
        </Section>

        <Section title="8. Termination" colors={colors}>
          We reserve the right to terminate or suspend access to the App at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
        </Section>

        <Section title="9. Changes to Terms" colors={colors}>
          We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms. We will notify users of material changes through the App.
        </Section>

        <Section title="10. Governing Law" colors={colors}>
          These Terms are governed by the laws of Australia. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Australia.
        </Section>

        <Section title="11. Contact" colors={colors}>
          For questions about these Terms, contact us at:{"\n\n"}
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

