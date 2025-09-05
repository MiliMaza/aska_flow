"use client";

import Image from "next/image";
import { Menu } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-secondary">
      <div className="flex items-center justify-between p-5">
        {/* Logo and Name */}
        <div className="flex items-center gap-4">
          <button className="">
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
