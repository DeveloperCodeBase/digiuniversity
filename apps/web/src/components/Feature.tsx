// Phase-A R2.1 — typed. Single "feature" cell with leading icon + title + description.
import React from "react";
import { Icon } from "../icons";

export interface FeatureProps {
  title: React.ReactNode;
  desc: React.ReactNode;
  /** Icon name from the shared icon set. */
  icon: string;
}

export const Feature: React.FC<FeatureProps> = ({ title, desc, icon }) => (
  <div>
    <div className="flex items-center gap-2 mb-2" style={{ color: "var(--cyan)" }}>
      <Icon name={icon} size={18} />
      <div style={{ fontWeight: 600, color: "var(--fg)", fontSize: 14 }}>{title}</div>
    </div>
    <div style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>{desc}</div>
  </div>
);

export default Feature;
