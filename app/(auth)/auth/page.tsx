"use client";

import Image from "next/image";
import { MoveDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary text-background">
      {/* White section */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-background"
          style={{
            clipPath: "ellipse(60% 50% at 50% 20%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center justify-center">
        <div className="text-center space-y-4 max-w-4xl">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/Logo.png"
              alt="AskaFlow Logo"
              width={100}
              height={100}
              className="mb-6"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-8 text-secondary">ASKA FLOW</h1>

          {/* Description */}
          <div className="max-w-3xl mx-auto">
            <div className="border-2 border-main rounded-lg p-4 bg-background/80 backdrop-blur-sm">
              <p className="text-lg text-foreground text-balance">
                Una <span className="font-bold">potente herramienta</span> para
                crear y diseñar automatizaciones. <br />
                Fácil, rápida y accesible para todos, sin necesidad de
                experiencia previa. <br />
                Solo debes describir lo que quieres{" "}
                <span className="font-bold"> automatizar</span>, y nuestra IA
                lo hará por ti.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center space-y-2 mt-10">
            <p className="text-xl font-semibold text-foreground">Comienza hoy</p>
            <MoveDown className="w-6 h-6" color="#01161eff" />
          </div>

          {/* Auth buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12">
            <SignInButton mode="modal">
              <Button variant="default" size="lg" className="px-10 text-lg">
                Iniciar Sesión
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button variant="default" size="lg" className="px-10 text-lg">
                Registrarse
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </div>
  );
}
