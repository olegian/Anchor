import { cn } from "../../lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 rounded-md",
  lg: "px-5 py-2.5 text-lg rounded-md",
  icon: "p-2 rounded-md", // Consistent rounded style for icons
};

const variantClasses = {
  default:
    "bg-blue-500 text-white shadow hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
  destructive:
    "bg-red-600 text-white shadow hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
  outline:
    "border border-zinc-300 text-zinc-700 shadow-sm hover:bg-zinc-100 focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1", // Added focus ring
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, variant = "default", size = "md", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-offset-2 disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
