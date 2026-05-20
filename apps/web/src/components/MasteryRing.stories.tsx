// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import { MasteryRing } from "./MasteryRing";

export default {
  title: "Widgets/MasteryRing",
  component: MasteryRing,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export const Low = { args: { percent: 25, sub: "۲ از ۹ هدف" } };
export const Mid = { args: { percent: 55, sub: "۵ از ۹ هدف" } };
export const High = { args: { percent: 78, sub: "۷ از ۹ هدف" } };
export const Complete = { args: { percent: 100, label: "تسلط کامل", sub: "۹ از ۹ هدف" } };
