import { forwardRef } from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={`
        shrink-0 bg-border-theme
        ${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"}
        ${className}
      `}
      {...props}
    />
  )
);
Separator.displayName = "Separator";