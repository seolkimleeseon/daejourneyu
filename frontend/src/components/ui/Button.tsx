"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white active:bg-brand-700 disabled:opacity-45",
  secondary:
    "bg-card border border-line-strong text-ink active:bg-brand-100 disabled:opacity-45",
  text: "bg-transparent text-ink-muted active:opacity-55",
};

export function Button({ variant = "primary", className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "flex w-full min-h-12 items-center justify-center rounded-lg px-4 text-sm font-bold transition-colors",
        variantClasses[variant],
        variant === "text" && "min-h-10 font-normal",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
