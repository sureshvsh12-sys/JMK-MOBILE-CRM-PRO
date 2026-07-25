import { StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "../../constants/theme";

type ScreenSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function ScreenSectionHeader({ title, subtitle }: ScreenSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: { marginTop: 4, color: COLORS.textMuted, fontSize: 11, lineHeight: 17 },
});
