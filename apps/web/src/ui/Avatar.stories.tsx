import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg", "xl"] } },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

const With = ({ size, src, name }: { size: "sm" | "md" | "lg" | "xl"; src?: string; name: string }) => (
  <Avatar size={size}>
    {src ? <AvatarImage src={src} alt={name} /> : null}
    <AvatarFallback>
      {name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)}
    </AvatarFallback>
  </Avatar>
);

export const Default: Story = {
  render: () => <With size="md" name="سارا عظیمی" />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <With size="sm" name="ع ع" />
      <With size="md" name="س ع" />
      <With size="lg" name="م م" />
      <With size="xl" name="ر ک" />
    </div>
  ),
};

export const WithImage: Story = {
  render: () => (
    <With
      size="lg"
      name="Sara Azimi"
      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NCIgaGVpZ2h0PSI0NCIgdmlld0JveD0iMCAwIDQ0IDQ0Ij48Y2lyY2xlIGN4PSIyMiIgY3k9IjIyIiByPSIyMiIgZmlsbD0iI2YwZWVlNSIvPjxjaXJjbGUgY3g9IjIyIiBjeT0iMTciIHI9IjciIGZpbGw9IiM4YThhODQiLz48ZWxsaXBzZSBjeD0iMjIiIGN5PSIzNiIgcng9IjEzIiByeT0iOSIgZmlsbD0iIzhhOGE4NCIvPjwvc3ZnPg=="
    />
  ),
};

export const FallbackOnError: Story = {
  // image src is bogus — AvatarFallback should render
  render: () => (
    <With size="lg" name="فلبک تست" src="/no-such-image-404.png" />
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <div style={{ display: "flex", gap: 12 }}>
      <With size="md" name="John Doe" />
      <With size="lg" name="Maria Garcia" />
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => <With size="lg" name="س ع" />,
};
