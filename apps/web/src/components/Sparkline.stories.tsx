// Phase-A R2.1 — typed.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sparkline } from "./Sparkline";

const meta: Meta<typeof Sparkline> = {
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
export default meta;

type Story = StoryObj<typeof Sparkline>;

export const Rising: Story = {
  args: { values: [40, 45, 52, 48, 55, 62, 68, 72, 75, 78], color: "var(--accent)" },
};

export const Falling: Story = {
  args: { values: [82, 78, 74, 72, 65, 60, 55, 50], color: "var(--rose)" },
};

export const Volatile: Story = {
  args: { values: [50, 70, 30, 60, 40, 75, 35, 65, 45], color: "var(--gold)" },
};

export const Tall: Story = {
  args: { values: [10, 25, 18, 42, 30, 55, 48, 70, 65], color: "var(--sage)", height: 80, width: 320 },
};
