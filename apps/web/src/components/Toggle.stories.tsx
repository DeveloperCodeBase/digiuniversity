// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import { useState } from "react";
import { Toggle } from "./Toggle";

export default {
  title: "Widgets/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export const Off = { args: { on: false } };
export const On = { args: { on: true } };

export const Interactive = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <div className="flex items-center gap-3" style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <Toggle on={on} onChange={setOn} />
        <span style={{ fontSize: 13 }}>{on ? "روشن" : "خاموش"}</span>
      </div>
    );
  },
};
