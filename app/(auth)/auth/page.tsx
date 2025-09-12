import Image from "next/image";
import { MoveDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";

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
                A <span className="font-bold">powerful tool</span> to create and
                design custom automations. <br />
                Easy, fast, and accessible{" "}
                <span className="font-bold">for everyone</span> — no experience
                needed. <br />
                Just describe what you want to automate, and our AI{" "}
                <span className="font-bold">builds it for you</span>.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center space-y-2 mt-10">
            <p className="text-xl font-semibold text-foreground">Start today</p>
            <MoveDown className="w-6 h-6" color="#01161eff" />
          </div>

          {/* Auth buttons */}
          {/* TODO: On click open Clerk Modals */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12">
            <Button
              variant="default"
              size="lg"
              className="bg-main hover:bg-accent text-white px-8 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Log In
            </Button>
            <Button
              variant="default"
              size="lg"
              className="bg-main hover:bg-accent text-white px-8 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
