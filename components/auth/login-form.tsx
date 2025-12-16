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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthActions();

  const handleGitHubLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn("github");
      router.push("/gioca");
    } catch (error: unknown) {
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to sign in with GitHub",
      });
    } finally {
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
          <form onSubmit={handleGitHubLogin}>
            <div className="flex flex-col gap-6">
              <Button
                type="submit"
                className="flex justify-center items-center gap-2 bg-background hover:bg-accent border border-input w-full text-black dark:text-white transition-colors hover:text-accent-foreground"
                disabled={isLoading}
              >
                <GithubIcon className="w-5 h-5" />
                <span className="font-medium">
                  {isLoading ? "Accesso in corso..." : "Accedi con GitHub"}
                </span>
              </Button>
            </div>
          </form>
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
