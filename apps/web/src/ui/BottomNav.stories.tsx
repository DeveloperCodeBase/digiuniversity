import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { BottomNav } from "./BottomNav";
import { RoleProvider } from "../role";
import { MemoryRouter } from "react-router-dom";

const meta: Meta<typeof BottomNav> = {
  title: "UI/Bottom Nav",
  component: BottomNav,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "iphone6" },
  },
};
export default meta;
type Story = StoryObj<typeof BottomNav>;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      minHeight: "100vh",
      background: "var(--bg)",
      paddingBottom: 64,
    }}
  >
    <div style={{ padding: 24, color: "var(--fg-mute)", fontSize: 13 }}>
      <p>page content — bottom nav is fixed at the bottom of the viewport.</p>
    </div>
    {children}
  </div>
);

const wrap = (storyFn: () => React.ReactElement) => (
  <MemoryRouter initialEntries={["/dashboard"]}>
    <RoleProvider>
      <Frame>{storyFn()}</Frame>
    </RoleProvider>
  </MemoryRouter>
);

export const Student: Story = {
  render: () => wrap(() => <BottomNav forceRole="student" active="dashboard" go={() => {}} />),
};

export const Instructor: Story = {
  render: () => wrap(() => <BottomNav forceRole="instructor" active="dashboard" go={() => {}} />),
};

export const Admin: Story = {
  render: () => wrap(() => <BottomNav forceRole="admin" active="audit" go={() => {}} />),
};

export const Parent: Story = {
  render: () => wrap(() => <BottomNav forceRole="parent" active="dashboard" go={() => {}} />),
};

export const Organization: Story = {
  render: () => wrap(() => <BottomNav forceRole="org" active="analytics" go={() => {}} />),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => wrap(() => <BottomNav forceRole="student" active="my-courses" go={() => {}} />),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => wrap(() => <BottomNav forceRole="student" active="dashboard" go={() => {}} />),
};
