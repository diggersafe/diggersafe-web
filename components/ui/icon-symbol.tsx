// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "construction": "construction",
  "truck.fill": "local-shipping",
  "shippingbox.fill": "inventory",
  "car.fill": "directions-car",
  "clipboard.fill": "assignment",
  "gearshape.fill": "settings",
  "plus": "add",
  "qrcode": "qr-code-2",
  "pencil": "edit",
  "trash.fill": "delete",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "camera.fill": "camera-alt",
  "square.and.arrow.up": "share",
  "arrow.left": "arrow-back",
  "clock.fill": "history",
} satisfies Record<string, MaterialIconName>;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
