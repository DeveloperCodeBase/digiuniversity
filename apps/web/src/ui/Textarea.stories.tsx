import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { Label } from "./Label";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "padded" },
  argTypes: {
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 6, maxWidth: 480 }}>
      <Label htmlFor="bio">بیوگرافی کوتاه</Label>
      <Textarea
        id="bio"
        placeholder="در چند جمله درباره خودتان بنویسید..."
        {...args}
      />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 480 }}>
      <Label htmlFor="bio-invalid" required>بیوگرافی</Label>
      <Textarea
        id="bio-invalid"
        invalid
        describedBy="bio-err"
        defaultValue="text"
      />
      <span id="bio-err" style={{ fontSize: 12, color: "var(--gold)" }}>
        حداقل ۲۰ کاراکتر لازم است.
      </span>
    </div>
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <div style={{ display: "grid", gap: 6, maxWidth: 480 }}>
      <Label htmlFor="bio-ltr">Short bio</Label>
      <Textarea id="bio-ltr" placeholder="Tell us about yourself..." />
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: Default.render!,
};
