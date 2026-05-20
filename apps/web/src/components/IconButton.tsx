// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import React from "react";
import { Icon } from "../icons";

export const IconButton = ({ icon, label, onClick, variant = "ghost", size = 14, className = "", ...rest }) => (
  <button
    type="button"
    className={`btn btn-${variant} icon-btn ${className}`}
    onClick={onClick}
    aria-label={label}
    title={label}
    {...rest}
  >
    <Icon name={icon} size={size} />
  </button>
);

export default IconButton;
