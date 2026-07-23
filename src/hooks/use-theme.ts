import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useTheme() {
  const currentScheme = useColorScheme();
  const scheme: ColorScheme = currentScheme === "dark" ? "dark" : "light";

  return Colors[scheme];
}
