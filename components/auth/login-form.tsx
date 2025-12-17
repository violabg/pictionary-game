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
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthActions();
  const createOrGetOAuthProfile = useMutation(api.auth.createOrGetOAuthProfile);
  const router = useRouter();

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
      // First, perform GitHub authentication
      const formData = new FormData();
      formData.append("redirectTo", "/gioca");
      await signIn("github", formData);

      // The ProfileInitializer will automatically create the profile when the user lands
      // But we can also try to create it here for faster UX
      try {
        await createOrGetOAuthProfile();
      } catch (profileError) {
        // Profile might already exist or will be created by ProfileInitializer
        console.log(
          "Profile creation deferred to ProfileInitializer",
          profileError
        );
      }

      router.push("/gioca");
    } catch (error: unknown) {
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
              onClick={handleGitHubLogin}
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
