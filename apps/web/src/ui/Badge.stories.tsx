import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  args: { children: "زنده" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "muted", "live"],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Live: Story = { args: { variant: "live" } };
export const Default: Story = { args: { variant: "default", children: "اطلاع" } };
export const Success: Story = { args: { variant: "success", children: "موفق" } };
export const Warning: Story = { args: { variant: "warning", children: "توجه" } };
export const Danger: Story = { args: { variant: "danger", children: "خطر" } };
export const Muted: Story = { args: { variant: "muted", children: "غیرفعال" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Badge variant="default">اطلاع</Badge>
      <Badge variant="success">موفق</Badge>
      <Badge variant="warning">توجه</Badge>
      <Badge variant="danger">خطر</Badge>
      <Badge variant="muted">غیرفعال</Badge>
      <Badge variant="live">LIVE</Badge>
    </div>
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Badge variant="default">Info</Badge>
      <Badge variant="success">Saved</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="danger">Failed</Badge>
      <Badge variant="muted">Inactive</Badge>
      <Badge variant="live">LIVE</Badge>
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: AllVariants.render!,
};
