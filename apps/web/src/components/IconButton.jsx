import React from "react";
import { Icon } from "../icons.jsx";

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
