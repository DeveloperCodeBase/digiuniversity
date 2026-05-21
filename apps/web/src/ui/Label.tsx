// Phase-16 R3 — Label primitive.
//
// A semantic <label> element with consistent typography. Use the
// `htmlFor` attribute to associate with an Input/Textarea/Select — or
// wrap the control as a child for implicit association.
//
// We don't use @radix-ui/react-label here because the primitive's
// only added value (auto-focus on tap) is browser-default behaviour
// for the same htmlFor association. Saves bundle bytes.
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Mark the field as required (renders a red asterisk after the label). */
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ className, required, children, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-[13px] font-medium text-[color:var(--fg)] mb-1.5",
          className,
        )}
        {...props}
      >
        {children}
        {required ? (
          <span
            aria-hidden="true"
            className="ms-1 text-[color:var(--gold)]"
          >
            *
          </span>
        ) : null}
      </label>
    );
  },
);
tagDisplayName(Label, "Label");
