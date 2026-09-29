import type { ListColor, Priority } from "./types";

export const LIST_COLOR_HEX: Record<ListColor, string> = {
  violet: "#7C6CF2",
  blue: "#3E83F8",
  teal: "#12A594",
  green: "#30A46C",
  amber: "#F5A524",
  orange: "#F76B15",
  rose: "#E5484D",
  slate: "#8B8D98",
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; rank: number }> = {
  high: { label: "High", color: "#E5484D", rank: 3 },
  medium: { label: "Medium", color: "#F5A524", rank: 2 },
  low: { label: "Low", color: "#3E83F8", rank: 1 },
  none: { label: "None", color: "var(--subtle)", rank: 0 },
};

export const PRIORITIES: Priority[] = ["high", "medium", "low", "none"];
