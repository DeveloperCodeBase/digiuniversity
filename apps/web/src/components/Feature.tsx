// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import React from "react";
import { Icon } from "../icons";

export const Feature = ({ title, desc, icon }) => (
  <div>
    <div className="flex items-center gap-2 mb-2" style={{ color: "var(--cyan)" }}>
      <Icon name={icon} size={18} />
      <div style={{ fontWeight: 600, color: "var(--fg)", fontSize: 14 }}>{title}</div>
    </div>
    <div style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>{desc}</div>
  </div>
);

export default Feature;
