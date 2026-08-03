import { StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

type ScreenSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function ScreenSectionHeader({ title, subtitle }: ScreenSectionHeaderProps) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: { marginTop: 4, color: COLORS.textMuted, fontSize: 11, lineHeight: 17 },
});
