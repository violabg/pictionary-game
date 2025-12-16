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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, {
      error: "Username deve essere almeno 3 caratteri",
    })
    .max(20, {
      error: "Username deve essere massimo 20 caratteri",
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      error:
        "Username può contenere solo lettere, numeri, underscore e trattini",
    }),

  email: z.email("Email non valida"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthActions();
  const createProfileIfNotExists = useMutation(
    api.auth.createProfileIfNotExists
  );

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
    },
    mode: "onChange",
  });

  const handleGitHubSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const values = form.getValues();
      await signIn("github");

      // Create profile after GitHub auth
      await createProfileIfNotExists({
        username: values.username,
        email: values.email,
        avatar_url: undefined,
      });

      router.push("/gioca");
    } catch (error: unknown) {
      toast.error("Errore", {
        description:
          error instanceof Error ? error.message : "Failed to sign up",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="gradient-border glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">Registrati</CardTitle>
          <CardDescription>Crea un nuovo account con GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={handleGitHubSignUp}
              className="space-y-4"
              autoComplete="off"
            >
              <FormField
                name="username"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="johndoe"
                        autoComplete="off"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="flex justify-center items-center gap-2 bg-background hover:bg-accent border border-input w-full text-black dark:text-white transition-colors hover:text-accent-foreground"
                disabled={isLoading || !form.formState.isValid}
              >
                <GithubIcon className="w-5 h-5" />
                <span className="font-medium">
                  {isLoading
                    ? "Registrazione in corso..."
                    : "Registrati con GitHub"}
                </span>
              </Button>

              <div className="mt-4 text-sm text-center">
                Hai già un account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Accedi
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
