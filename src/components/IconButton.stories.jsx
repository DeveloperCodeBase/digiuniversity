import { IconButton } from "./IconButton.jsx";

export default {
  title: "Widgets/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export const Ghost = { args: { icon: "settings", label: "تنظیمات", variant: "ghost" } };
export const Outline = { args: { icon: "bell", label: "اعلان‌ها", variant: "outline" } };
export const Primary = { args: { icon: "send", label: "ارسال پیام", variant: "primary" } };
