"use client";

import { GithubIcon } from "@/components/icons/github";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthActions();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget as HTMLFormElement);
      // Convex Auth handles the redirect internally
      // Add redirectTo param to the form data
      formData.append("redirectTo", "/gioca");
      await signIn("resend", formData);
    } catch (error: unknown) {
      console.log("🚀 ~ handleLogin ~ error:", error);
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to sign in with Resend",
      });
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convex Auth handles the redirect internally
      // GitHub doesn't need form data, just pass the provider and redirect
      const formData = new FormData();
      formData.append("redirectTo", "/gioca");
      await signIn("github", formData);
    } catch (error: unknown) {
      console.log("🚀 ~ handleGitHubLogin ~ error:", error);
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to sign in with GitHub",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="gradient-border glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">Accedi</CardTitle>
          <CardDescription>Accedi con il tuo account GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input type="text" name="email" placeholder="Email" />
            <Button type="submit">Signin with Resend</Button>
          </form>
          <Separator className="my-4" />

          <div className="flex flex-col gap-6">
            <Button
              className="flex justify-center items-center gap-2 bg-background hover:bg-accent border border-input w-full text-black dark:text-white transition-colors hover:text-accent-foreground"
              disabled={isLoading}
              onClick={() => void signIn("github")}
            >
              <GithubIcon className="w-5 h-5" />
              <span className="font-medium">
                {isLoading ? "Accesso in corso..." : "Accedi con GitHub"}
              </span>
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="mt-4 text-sm text-center">
            Non hai un account?{" "}
            <Link href="/auth/sign-up" className="underline underline-offset-4">
              Registrati
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
