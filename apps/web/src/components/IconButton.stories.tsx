// Phase-A R2.1 — typed.
import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./IconButton";

const meta: Meta<typeof IconButton> = {
  title: "Widgets/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof IconButton>;

export const Ghost: Story = { args: { icon: "settings", label: "تنظیمات", variant: "ghost" } };
export const Outline: Story = { args: { icon: "bell", label: "اعلان‌ها", variant: "outline" } };
export const Primary: Story = { args: { icon: "send", label: "ارسال پیام", variant: "primary" } };
