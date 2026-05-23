// Phase-A R2.1 — typed.
import type { Meta, StoryObj } from "@storybook/react";
import { MasteryRing } from "./MasteryRing";

const meta: Meta<typeof MasteryRing> = {
  title: "Widgets/MasteryRing",
  component: MasteryRing,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof MasteryRing>;

export const Low: Story = { args: { percent: 25, sub: "۲ از ۹ هدف" } };
export const Mid: Story = { args: { percent: 55, sub: "۵ از ۹ هدف" } };
export const High: Story = { args: { percent: 78, sub: "۷ از ۹ هدف" } };
export const Complete: Story = { args: { percent: 100, label: "تسلط کامل", sub: "۹ از ۹ هدف" } };
