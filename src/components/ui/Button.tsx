import { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
}

const variants = {
  default: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20",
  destructive: "bg-red-500 text-white hover:bg-red-500/90 shadow-lg shadow-red-500/20",
  outline: "border border-border-theme bg-background hover:bg-muted-area hover:text-foreground",
  secondary: "bg-muted-area text-muted-text hover:bg-muted-area/80",
  ghost: "hover:bg-muted-area hover:text-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  success: "bg-emerald-500 text-white hover:bg-emerald-500/90 shadow-lg shadow-emerald-500/20",
  warning: "bg-amber-500 text-white hover:bg-amber-500/90 shadow-lg shadow-amber-500/20",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-xl px-3",
  lg: "h-11 rounded-2xl px-8",
  icon: "h-10 w-10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 rounded-xl font-bold
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";