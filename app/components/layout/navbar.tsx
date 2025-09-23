"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { useSidebar } from "@/app/components/layout/side-context";
import { Button } from "@/app/components/ui/button";

export default function Navbar() {
  const { toggle, isOpen } = useSidebar();

  return (
    <nav
      className={`bg-secondary w-full transition-all duration-300 ${
        isOpen ? "lg:pl-72" : "lg:pl-0"
      }`}
    >
      <div className="flex items-center justify-between p-5">
        {/* Logo and Name */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggle}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-4">
            <Image
              src="/Logo.png"
              alt="Aska Flow Logo"
              width={32}
              height={32}
            />
            <span className="text-2xl font-bold text-background">
              ASKA <span className="font-semibold">FLOW</span>
            </span>
          </div>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-4">
          {/* TODO: Implement Clerk Profile Button */}
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background font-semibold">
            U
          </div>
        </div>
      </div>
    </nav>
  );
}
