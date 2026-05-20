// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import { Sparkline } from "./Sparkline";

export default {
  title: "Widgets/Sparkline",
  component: Sparkline,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 240, padding: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <Story />
      </div>
    ),
  ],
};

export const Rising = {
  args: { values: [40, 45, 52, 48, 55, 62, 68, 72, 75, 78], color: "var(--accent)" },
};

export const Falling = {
  args: { values: [82, 78, 74, 72, 65, 60, 55, 50], color: "var(--rose)" },
};

export const Volatile = {
  args: { values: [50, 70, 30, 60, 40, 75, 35, 65, 45], color: "var(--gold)" },
};

export const Tall = {
  args: { values: [10, 25, 18, 42, 30, 55, 48, 70, 65], color: "var(--sage)", height: 80, width: 320 },
};
