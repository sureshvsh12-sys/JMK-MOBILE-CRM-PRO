import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    COLORS,
    SHADOW,
} from "../constants/theme";

type BrandLogoProps = {
  size?: number;
  showGroupName?: boolean;
  showTagline?: boolean;
};

export default function BrandLogo({
  size = 120,
  showGroupName = true,
  showTagline = true,
}: BrandLogoProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.logoText,
            {
              fontSize: size * 0.35,
            },
          ]}
        >
          JMK
        </Text>
      </View>

      {showGroupName && (
        <Text style={styles.groupName}>
          JMK GROUP
        </Text>
      )}

      {showTagline && (
        <Text style={styles.tagline}>
          Trust • Growth • Future
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },

  logoCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.12)",
    ...SHADOW,
  },

  logoText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 1,
  },

  groupName: {
    marginTop: 18,
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },

  tagline: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});