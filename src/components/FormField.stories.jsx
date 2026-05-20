import { useState } from "react";
import { FormField } from "./FormField.jsx";

export default {
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

export const Default = {
  args: {
    label: "نام کامل",
    placeholder: "نسرین رضوی",
  },
};

export const WithHint = {
  args: {
    label: "ایمیل دانشگاهی",
    placeholder: "you@digiu.edu",
    hint: "از ایمیل رسمی دانشگاه استفاده کنید.",
  },
};

export const Required = {
  args: {
    label: "رمز عبور",
    type: "password",
    placeholder: "••••••••",
    required: true,
  },
};

export const WithError = {
  args: {
    label: "کد دانشجویی",
    placeholder: "84-XX-XX",
    error: "فرمت کد دانشجویی صحیح نیست.",
    value: "abc",
  },
};

export const Monospace = {
  args: {
    label: "شناسه گواهی",
    placeholder: "DU-2026-...",
    mono: true,
  },
};

export const Interactive = {
  render: () => {
    const [v, setV] = useState("");
    return <FormField label="موضوع" placeholder="چه چیزی می‌خواهید بپرسید؟" value={v} onChange={(e) => setV(e.target.value)} />;
  },
};
