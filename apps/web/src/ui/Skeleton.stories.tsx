import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = { args: { variant: "text", w: "60%" } };
export const Circle: Story = { args: { variant: "circle", w: 48, h: 48 } };
export const Rect: Story = { args: { variant: "rect", w: 320, h: 140 } };

export const ThreeLines: Story = {
  args: { variant: "text", lines: 3, h: 12 },
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="card" style={{ width: 320 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Skeleton variant="circle" w={48} h={48} />
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <Skeleton w="70%" h={14} />
          <Skeleton w="40%" h={12} />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Skeleton variant="text" lines={3} />
      </div>
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  args: { variant: "rect", w: 320, h: 140 },
};
