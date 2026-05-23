// Phase-A R2.1 — typed.
import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Widgets/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Toggle>;

export const Off: Story = { args: { on: false } };
export const On: Story = { args: { on: true } };

export const Interactive: Story = {
  render: () => {
    const [on, setOn] = useState<boolean>(false);
    return (
      <div className="flex items-center gap-3" style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <Toggle on={on} onChange={setOn} />
        <span style={{ fontSize: 13 }}>{on ? "روشن" : "خاموش"}</span>
      </div>
    );
  },
};
