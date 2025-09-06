"use client";

import { createContext, useContext, useState } from "react";

type AsideContextType = {
  isOpen: boolean;
  toggle: () => void;
};

const AsideContext = createContext<AsideContextType | undefined>(undefined);

export function AsideProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <AsideContext.Provider value={{ isOpen, toggle }}>
      {children}
    </AsideContext.Provider>
  );
}

export function useAside() {
  const context = useContext(AsideContext);
  if (context === undefined) {
    throw new Error("AsideProvider error.");
  }
  return context;
}
