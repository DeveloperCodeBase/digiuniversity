// Phase-A R2.1 — typed.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Feature } from "./Feature";

const meta: Meta<typeof Feature> = {
  title: "Widgets/Feature",
  component: Feature,
  tags: ["autodocs"],
  decorators: [
    (Story) => <div style={{ maxWidth: 320, padding: 20, background: "var(--bg)" }}><Story /></div>,
  ],
};
export default meta;

type Story = StoryObj<typeof Feature>;

export const Search: Story = {
  args: { title: "بازیابی هیبرید", desc: "BM25 + dense embeddings برای جستجوی معنایی", icon: "search" },
};

export const Play: Story = {
  args: { title: "جهش به ثانیه", desc: "نتایج جستجو مستقیماً به ثانیه‌ی دقیق ویدئو", icon: "play" },
};

export const Sparkle: Story = {
  args: { title: "استخراج مفهوم", desc: "NER و تحلیل ابهام در لحظه‌ی تدریس", icon: "sparkle" },
};
