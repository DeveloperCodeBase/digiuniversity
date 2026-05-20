import { Feature } from "./Feature.jsx";

export default {
  title: "Widgets/Feature",
  component: Feature,
  tags: ["autodocs"],
  decorators: [
    (Story) => <div style={{ maxWidth: 320, padding: 20, background: "var(--bg)" }}><Story /></div>,
  ],
};

export const Search = {
  args: { title: "بازیابی هیبرید", desc: "BM25 + dense embeddings برای جستجوی معنایی", icon: "search" },
};

export const Play = {
  args: { title: "جهش به ثانیه", desc: "نتایج جستجو مستقیماً به ثانیه‌ی دقیق ویدئو", icon: "play" },
};

export const Sparkle = {
  args: { title: "استخراج مفهوم", desc: "NER و تحلیل ابهام در لحظه‌ی تدریس", icon: "sparkle" },
};
