export type ThemeKey = "black" | "charcoal" | "cream" | "white";

export const THEMES: Record<ThemeKey, {
  labelKey: "themeBlack" | "themeCharcoal" | "themeCream" | "themeWhite";
  swatch: string;
  bg: string;
  header: string;
  border: string;
  text: string;
  sub: string;
  card: string;
}> = {
  black: {
    labelKey: "themeBlack",
    swatch:   "#111111",
    bg:       "bg-[#111]",
    header:   "bg-[#111]/95",
    border:   "border-white/8",
    text:     "text-white",
    sub:      "text-white/30",
    card:     "bg-white/[0.03]",
  },
  charcoal: {
    labelKey: "themeCharcoal",
    swatch:   "#2a2a2a",
    bg:       "bg-[#2a2a2a]",
    header:   "bg-[#2a2a2a]/95",
    border:   "border-white/10",
    text:     "text-white",
    sub:      "text-white/30",
    card:     "bg-white/[0.03]",
  },
  cream: {
    labelKey: "themeCream",
    swatch:   "#ede8df",
    bg:       "bg-[#ede8df]",
    header:   "bg-[#ede8df]/95",
    border:   "border-black/8",
    text:     "text-[#1a1a1a]",
    sub:      "text-[#1a1a1a]/40",
    card:     "bg-black/[0.03]",
  },
  white: {
    labelKey: "themeWhite",
    swatch:   "#f5f5f3",
    bg:       "bg-[#f5f5f3]",
    header:   "bg-[#f5f5f3]/95",
    border:   "border-black/8",
    text:     "text-[#111]",
    sub:      "text-[#111]/35",
    card:     "bg-black/[0.02]",
  },
};
