// Phase-A R2.1 — typed.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Stat } from "./Stat";

const meta: Meta<typeof Stat> = {
  title: "Widgets/Stat (Hero)",
  component: Stat,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 200, padding: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Stat>;

export const Default: Story = { args: { v: "۸", unit: " دانشکده", l: "مهندسی · پزشکی · علوم پایه · AI · مدیریت · انسانی · هنر · حقوق" } };
export const Big: Story = { args: { v: "۸,۴۰۰", unit: " دانشجو", l: "در ۴۲ شهر و ۲۸ کشور" } };
