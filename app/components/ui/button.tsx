import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-xs rounded-lg text-md font-medium transition-all shrink-0 outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-main text-background hover:bg-accent focus:outline-none focus:ring-1 focus:ring-background/80",
        secondary:
          "text-foreground bg-background hover:bg-accent hover:text-background focus:outline-none focus:ring-2 focus:ring-background",
        outline:
          "border border-main bg-background text-sm hover:bg-main/10 focus:outline-none focus:ring-1 focus:ring-main",
        ghost: "hover:bg-accent/20 text-background",
        special: "bg-main text-white hover:bg-secondary hover:scale-105",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 gap-2 px-4 py-2 text-sm",
        md: "h-10 gap-2",
        lg: "h-12 p-4",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
