"use client";

import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";

export default function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const id = useId();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  return (
    <div className="relative">
      <Input
        id={id}
        className={cn("pe-12", className)}
        placeholder="Password"
        type={isVisible ? "text" : "password"}
        {...props}
      />
      <button
        className="focus:z-10 absolute inset-y-0 flex justify-center items-center disabled:opacity-50 rounded-e-xl focus-visible:outline-none w-12 h-full text-muted-foreground hover:text-foreground transition-all focus-visible:-translate-y-1 active:translate-y-0 disabled:cursor-not-allowed disabled:pointer-events-none end-0"
        type="button"
        onClick={toggleVisibility}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        aria-controls="password"
      >
        {isVisible ? (
          <EyeOffIcon size={20} aria-hidden="true" />
        ) : (
          <EyeIcon size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
