import React from "react";

export const Stat = ({ v, unit, l }) => (
  <div className="hero-stat">
    <div className="v">{v}{unit && <span className="unit">{unit}</span>}</div>
    <div className="l">{l}</div>
  </div>
);

export default Stat;
