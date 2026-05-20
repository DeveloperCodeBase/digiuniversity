// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import { StatCard } from "./StatCard";

export default {
  title: "Widgets/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 20, background: "var(--bg)" }}>
        <Story />
      </div>
    ),
  ],
};

export const Default = {
  args: {
    l: "میانگین تسلط",
    v: "۷۸",
    unit: "٪",
    trend: "+ ۴.۲",
    spark: [40, 45, 52, 48, 55, 62, 68, 72, 75, 78],
    color: "var(--cyan)",
  },
};

export const Down = {
  args: {
    l: "ریسک افت",
    v: "کم",
    trend: "نگرانی نیست",
    spark: [0.3, 0.25, 0.2, 0.18, 0.15, 0.13, 0.12, 0.1],
    color: "var(--gold)",
    trendDown: true,
  },
};

export const WithUnit = {
  args: {
    l: "ساعت مطالعه",
    v: "۲۴",
    unit: "h/هفته",
    trend: "بالاتر از متوسط",
    spark: [16, 18, 20, 22, 23, 24, 23, 24],
    color: "var(--sage)",
  },
};

export const NoSparkline = {
  args: {
    l: "وضعیت",
    v: "ممتاز",
    trend: null,
  },
};
