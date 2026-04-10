import { Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "defaultSemiBold";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "defaultSemiBold" ? { fontWeight: "600" } : null,
        style,
      ]}
      {...rest}
    />
  );
}
