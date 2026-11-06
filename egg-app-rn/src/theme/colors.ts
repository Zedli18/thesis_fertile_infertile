/**
 * Egg Fertility Detector — color palette.
 * Keep every screen/component pulling colors from here so the theme
 * stays consistent and easy to retint later.
 */
export const COLORS = {
  background: "#F6F2EA", // Warm Cream
  primary: "#F4C585", // Golden Yolk
  primarySoft: "#FCE4BB", // lightened yolk, used for icon chips/badges
  text: "#1C1B1F", // Deep Earth
  textMuted: "#6B675F",
  surface: "#FFFFFF", // Pure White cards
  divider: "#ECE7DE",

  fertile: "#1FA974",
  fertileTint: "#D7F3E6",
  infertile: "#D6455C",
  infertileTint: "#F8D9DE",

  white: "#FFFFFF",
} as const;

export type ColorName = keyof typeof COLORS;
