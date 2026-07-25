import { Image, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../constants/theme";

const DARK_LOGO = require("../../assets/images/jmk-logo-dark.png");
const LIGHT_LOGO = require("../../assets/images/jmk-logo-light.png");

type BrandLogoProps = {
  width?: number;
  showGroupName?: boolean;
  showTagline?: boolean;
  background?: "dark" | "light";
  compact?: boolean;
};

export default function BrandLogo({
  width = 150,
  showGroupName = true,
  showTagline = true,
  background = "dark",
  compact = false,
}: BrandLogoProps) {
  const isLight = background === "light";
  const logoHeight = width * 0.335;

  return (
    <View
      accessibilityLabel="JMK Group"
      accessibilityRole="image"
      style={styles.container}
    >
      <Image
        source={isLight ? LIGHT_LOGO : DARK_LOGO}
        resizeMode="contain"
        style={{ width, height: logoHeight }}
      />

      {showGroupName ? (
        <Text
          style={[
            styles.groupName,
            {
              color: isLight ? COLORS.black : COLORS.white,
              fontSize: Math.max(10, width * 0.1),
              letterSpacing: Math.max(2.5, width * 0.035),
              marginTop: compact ? -1 : 2,
            },
          ]}
        >
          GROUP
        </Text>
      ) : null}

      {showTagline ? (
        <Text
          style={[
            styles.tagline,
            isLight && styles.taglineLight,
            {
              fontSize: Math.max(9, width * 0.066),
              marginTop: compact ? 3 : 7,
            },
          ]}
        >
          Trust <Text style={styles.dot}>•</Text> Growth{" "}
          <Text style={styles.dot}>•</Text> Future
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  groupName: {
    fontWeight: "900",
    textAlign: "center",
  },
  tagline: {
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
  },
  taglineLight: {
    color: "#334155",
  },
  dot: {
    color: COLORS.primary,
  },
});
