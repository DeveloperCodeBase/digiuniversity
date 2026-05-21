import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { Label } from "./Label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "padded" },
  argTypes: {
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["text", "email", "password", "tel", "url", "search", "number"],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 6, maxWidth: 360 }}>
      <Label htmlFor="email-default">ایمیل دانشگاهی</Label>
      <Input id="email-default" type="email" placeholder="you@example.com" {...args} />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 360 }}>
      <Label htmlFor="email-invalid" required>ایمیل دانشگاهی</Label>
      <Input
        id="email-invalid"
        type="email"
        defaultValue="not-an-email"
        invalid
        describedBy="err-1"
      />
      <span id="err-1" style={{ fontSize: 12, color: "var(--gold)" }}>
        لطفاً یک ایمیل معتبر وارد کنید.
      </span>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 360 }}>
      <Label htmlFor="email-disabled">ایمیل دانشگاهی</Label>
      <Input id="email-disabled" type="email" disabled defaultValue="you@example.com" />
    </div>
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 360 }}>
      <Label htmlFor="email-ltr">University email</Label>
      <Input id="email-ltr" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 360 }}>
      <Label htmlFor="email-dark">ایمیل دانشگاهی</Label>
      <Input id="email-dark" type="email" placeholder="you@example.com" />
    </div>
  ),
};
