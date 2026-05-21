import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

const InboxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const Default: Story = {
  args: {
    icon: <InboxIcon />,
    title: "هیچ پیامی ندارید",
    body: "وقتی استاد یا همکلاسی برایتان پیامی بفرستد، اینجا نمایش داده می‌شود.",
    cta: <Button size="sm">شروع گفتگو</Button>,
  },
};

export const Compact: Story = {
  args: { ...Default.args, density: "compact" },
};

export const NoIconNoBody: Story = {
  args: { title: "هیچ نتیجه‌ای پیدا نشد" },
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  args: {
    icon: <InboxIcon />,
    title: "No messages yet",
    body: "When a professor or classmate sends you a message, it will appear here.",
    cta: <Button size="sm">Start a chat</Button>,
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  args: Default.args,
};
