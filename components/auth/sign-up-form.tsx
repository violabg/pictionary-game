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
import { Separator } from "@/components/ui/separator";
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
    .min(3, "Username deve essere almeno 3 caratteri")
    .max(20, "Username deve essere massimo 20 caratteri")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username può contenere solo lettere, numeri, underscore e trattini"
    ),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve essere almeno 8 caratteri"),
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
  const createOrGetOAuthProfile = useMutation(api.auth.createOrGetOAuthProfile);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const handleSignUp = async (values: SignUpFormValues) => {
    setIsLoading(true);

    try {
      // Sign up with email and password
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("flow", "signUp");

      await signIn("password", formData);

      // Create profile after successful signup
      await createProfileIfNotExists({
        username: values.username,
        email: values.email,
        avatar_url: undefined,
      });

      toast.success("Registrazione completata!");
      router.push("/gioca");
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Impossibile completare la registrazione",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign up with GitHub
      const formData = new FormData();
      formData.append("redirectTo", "/gioca");
      await signIn("github", formData);

      // Try to create profile for GitHub user
      // ProfileInitializer will also handle this as a fallback
      try {
        await createOrGetOAuthProfile({
          username: undefined,
          email: undefined,
          avatar_url: undefined,
        });
      } catch (profileError) {
        console.log(
          "Profile creation deferred to ProfileInitializer",
          profileError
        );
      }

      toast.success("Registrazione completata!");
      router.push("/gioca");
    } catch (error: unknown) {
      console.error("GitHub sign up error:", error);
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Impossibile completare la registrazione con GitHub",
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
          <CardDescription>Crea un nuovo account per giocare</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSignUp)}
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

              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
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
                className="w-full"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? "Registrazione in corso..." : "Registrati"}
              </Button>
            </form>
          </Form>

          <Separator className="my-4" />

          <div className="flex flex-col gap-4">
            <Button
              className="flex justify-center items-center gap-2 bg-background hover:bg-accent border border-input w-full text-black dark:text-white transition-colors hover:text-accent-foreground"
              disabled={isLoading}
              onClick={handleGitHubSignUp}
            >
              <GithubIcon className="w-5 h-5" />
              <span className="font-medium">
                {isLoading
                  ? "Registrazione in corso..."
                  : "Registrati con GitHub"}
              </span>
            </Button>
          </div>

          <div className="mt-4 text-sm text-center">
            Hai già un account?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              Accedi
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
