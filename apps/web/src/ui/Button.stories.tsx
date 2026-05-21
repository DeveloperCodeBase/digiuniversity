import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
  args: { children: "ثبت‌نام رایگان" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "outline", "ink", "danger"],
    },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Danger: Story = { args: { variant: "danger" } };
export const Loading: Story = { args: { variant: "primary", loading: true } };
export const Disabled: Story = { args: { variant: "primary", disabled: true } };
export const Small: Story = { args: { variant: "primary", size: "sm" } };
export const Large: Story = { args: { variant: "primary", size: "lg" } };

export const LTR: Story = {
  args: { variant: "primary", children: "Sign up free" },
  parameters: { dir: "ltr" },
};

export const Dark: Story = {
  args: { variant: "primary" },
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ink">Ink</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
