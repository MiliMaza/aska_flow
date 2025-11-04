"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(var(--background) / 1)",
          "--normal-text": "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
