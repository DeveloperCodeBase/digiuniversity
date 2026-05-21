import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, toast } from "./Toast";
import { Button } from "./Button";

const meta: Meta = {
  title: "UI/Toast",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

const TriggerRow = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <Button onClick={() => toast.info("پیام اطلاع‌رسانی")}>info</Button>
    <Button
      variant="secondary"
      onClick={() => toast.success("تغییرات با موفقیت ذخیره شد")}
    >
      success
    </Button>
    <Button
      variant="outline"
      onClick={() =>
        toast.warn("سرور پاسخ کندی دارد", {
          description: "ممکن است چند ثانیه طول بکشد.",
        })
      }
    >
      warn
    </Button>
    <Button
      variant="danger"
      onClick={() =>
        toast.danger("ذخیره ناموفق بود", {
          description: "اتصال شبکه قطع شد. تلاش مجدد؟",
          action: { label: "تلاش مجدد", onClick: () => toast.success("ذخیره شد") },
        })
      }
    >
      danger + action
    </Button>
  </div>
);

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <TriggerRow />
    </ToastProvider>
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <ToastProvider>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={() => toast.success("Saved successfully")}>Save</Button>
        <Button
          variant="danger"
          onClick={() =>
            toast.danger("Save failed", {
              description: "Network unreachable. Retry?",
            })
          }
        >
          Trigger danger
        </Button>
      </div>
    </ToastProvider>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <ToastProvider>
      <TriggerRow />
    </ToastProvider>
  ),
};
