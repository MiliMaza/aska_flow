import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border border-foreground placeholder:text-foreground/80 focus:border-main field-sizing-content w-full rounded-lg p-4 text-base shadow-xs outline-none",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
