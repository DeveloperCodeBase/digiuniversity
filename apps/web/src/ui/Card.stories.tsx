import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
import { Button } from "./Button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "select", options: ["default", "flat", "bordered"] },
    padding: { control: "select", options: [undefined, "none", "sm", "md", "lg"] },
  },
};
export default meta;
type Story = StoryObj<typeof Card>;

const Sample = () => (
  <>
    <CardHeader>
      <CardTitle>درس جدید پیشنهادی</CardTitle>
      <CardDescription>
        یادگیری ماشین مقدماتی — بر اساس پیشرفت اخیر شما
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p style={{ fontSize: 13, color: "var(--fg-mute)", margin: 0 }}>
        ۱۲ هفته · ۲۴ ماژول · ۸۴۳ دانشجو فعال
      </p>
    </CardContent>
    <CardFooter>
      <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>CS-410</span>
      <Button size="sm">شروع</Button>
    </CardFooter>
  </>
);

export const Default: Story = {
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Card {...args}>
        <Sample />
      </Card>
    </div>
  ),
};

export const Flat: Story = { ...Default, args: { variant: "flat" } };
export const Bordered: Story = { ...Default, args: { variant: "bordered" } };

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Card>
        <CardHeader>
          <CardTitle>Recommended course</CardTitle>
          <CardDescription>
            Intro to ML — based on your recent progress
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>CS-410</span>
          <Button size="sm">Start</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Card>
        <Sample />
      </Card>
    </div>
  ),
};
