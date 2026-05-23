// Phase-A R2.1 — typed.
import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./FormField";

const meta: Meta<typeof FormField> = {
  title: "Widgets/FormField",
  component: FormField,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 20, background: "var(--bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: "نام کامل",
    placeholder: "نسرین رضوی",
  },
};

export const WithHint: Story = {
  args: {
    label: "ایمیل دانشگاهی",
    placeholder: "you@digiu.edu",
    hint: "از ایمیل رسمی دانشگاه استفاده کنید.",
  },
};

export const Required: Story = {
  args: {
    label: "رمز عبور",
    type: "password",
    placeholder: "••••••••",
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: "کد دانشجویی",
    placeholder: "84-XX-XX",
    error: "فرمت کد دانشجویی صحیح نیست.",
    value: "abc",
  },
};

export const Monospace: Story = {
  args: {
    label: "شناسه گواهی",
    placeholder: "DU-2026-...",
    mono: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const [v, setV] = useState<string>("");
    return <FormField label="موضوع" placeholder="چه چیزی می‌خواهید بپرسید؟" value={v} onChange={(e) => setV(e.target.value)} />;
  },
};
