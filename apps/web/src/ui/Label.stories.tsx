import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label";
import { Input } from "./Input";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 320 }}>
      <Label htmlFor="email1">ایمیل دانشگاهی</Label>
      <Input id="email1" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 320 }}>
      <Label htmlFor="email2" required>ایمیل دانشگاهی</Label>
      <Input id="email2" type="email" required placeholder="you@example.com" />
    </div>
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 320 }}>
      <Label htmlFor="email3" required>University email</Label>
      <Input id="email3" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: Required.render!,
};
