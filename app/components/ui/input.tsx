import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-foreground/80 p-4 h-12 w-full min-w-0 rounded-lg border border-foreground shadow-xs transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-main focus:border-main",
        className
      )}
      {...props}
    />
  );
}

export { Input };
