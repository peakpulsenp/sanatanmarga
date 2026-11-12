import { forwardRef } from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "success" | "warning" | "outline";
}

const variants = {
  default: "bg-primary text-white",
  secondary: "bg-muted-area text-muted-text",
  destructive: "bg-red-500 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  outline: "text-foreground border border-border-theme",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors
        ${variants[variant]} ${className}
      `}
      {...props}
    />
  )
);
Badge.displayName = "Badge";