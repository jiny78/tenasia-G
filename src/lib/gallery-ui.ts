import type { ThemeKey } from "@/lib/themes";

export type { ThemeKey };

export type Filters = {
  q: string;
  person: string;
  event: string;
  dateFrom: string;
  dateTo: string;
  year: string;
  orientation: "" | "landscape" | "portrait" | "square";
  agency: string;
};
