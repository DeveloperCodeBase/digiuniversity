// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import React from "react";
import { Sparkline } from "./Sparkline";

export const StatCard = ({ l, v, unit, trend, spark, color, trendDown }) => (
  <div className="stat">
    <div className="l">{l}</div>
    <div className="v">{v}{unit && <span className="unit">{unit}</span>}</div>
    {trend && <div className={"trend " + (trendDown ? "down" : "")}>{trend}</div>}
    {spark && <div className="spark"><Sparkline values={spark} color={color} height={40} /></div>}
  </div>
);

export default StatCard;
