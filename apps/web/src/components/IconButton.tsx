// Phase-A R2.1 — typed. Icon-only button with aria-label and tooltip.
import React from "react";
import { Icon } from "../icons";

export type IconButtonVariant = "ghost" | "outline" | "primary";

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Icon name from the shared icon set. */
  icon: string;
  /** Accessible label used as aria-label + title (tooltip). */
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: IconButtonVariant;
  size?: number;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onClick,
  variant = "ghost",
  size = 14,
  className = "",
  ...rest
}) => (
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
