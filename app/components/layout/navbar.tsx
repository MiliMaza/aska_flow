"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { useAside } from "./aside-context";

export default function Navbar() {
  const { toggle, isOpen } = useAside();

  return (
    <nav
      className={`bg-secondary w-full transition-all duration-300 ${
        isOpen ? "lg:pl-72" : "lg:pl-0"
      }`}
    >
      <div className="flex items-center justify-between p-5">
        {/* Logo and Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="hover:bg-accent/20 p-2 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" color="#f7f7ffff" />
          </button>
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
