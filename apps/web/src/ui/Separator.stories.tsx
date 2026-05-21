import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./Separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <div style={{ padding: 12 }}>بخش بالا</div>
      <Separator />
      <div style={{ padding: 12 }}>بخش پایین</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: "flex", height: 32, alignItems: "center", gap: 12 }}>
      <span>دانشکده</span>
      <Separator orientation="vertical" />
      <span>برنامه</span>
      <Separator orientation="vertical" />
      <span>درس</span>
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: Horizontal.render!,
};
