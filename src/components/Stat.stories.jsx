import { Stat } from "./Stat.jsx";

export default {
  title: "Widgets/Stat (Hero)",
  component: Stat,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 200, padding: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <Story />
      </div>
    ),
  ],
};

export const Default = { args: { v: "۸", unit: " دانشکده", l: "مهندسی · پزشکی · علوم پایه · AI · مدیریت · انسانی · هنر · حقوق" } };
export const Big = { args: { v: "۸,۴۰۰", unit: " دانشجو", l: "در ۴۲ شهر و ۲۸ کشور" } };
