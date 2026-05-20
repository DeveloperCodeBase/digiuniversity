// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import React from "react";

export const Stat = ({ v, unit, l }) => (
  <div className="hero-stat">
    <div className="v">{v}{unit && <span className="unit">{unit}</span>}</div>
    <div className="l">{l}</div>
  </div>
);

export default Stat;
