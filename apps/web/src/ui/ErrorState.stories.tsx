import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState } from "./ErrorState";

const meta: Meta<typeof ErrorState> = {
  title: "UI/Error State",
  component: ErrorState,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {
  args: {
    title: "اتصال برقرار نیست",
    body: "نتوانستیم به سرور درس‌ها دسترسی پیدا کنیم. این معمولاً موقتی است.",
    retry: () => alert("retry pressed"),
  },
};

export const WithDetail: Story = {
  args: {
    title: "خطا در بارگذاری ضبط جلسه",
    body: "ممکن است ضبط هنوز در حال پردازش باشد.",
    retry: () => alert("retry pressed"),
    detail: "RecordingNotReady: tenant=demo recording=rec_8x4w status=processing",
  },
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  args: {
    title: "Connection lost",
    body: "We couldn't reach the courses server. This is usually temporary.",
    retry: () => alert("retry pressed"),
    retryLabel: "Try again",
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  args: Default.args,
};
