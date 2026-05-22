import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeProvider } from "../ui-shell";

const meta: Meta<typeof ThemeToggle> = {
  title: "UI/ThemeToggle",
  component: ThemeToggle,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: "radio",
      options: ["icon", "labeled", "switch"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const IconOnly: Story = { args: { variant: "icon" } };
export const Labeled: Story = { args: { variant: "labeled" } };
export const SwitchVariant: Story = { args: { variant: "switch" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      <ThemeToggle variant="icon" />
      <ThemeToggle variant="labeled" />
      <ThemeToggle variant="switch" />
    </div>
  ),
};
