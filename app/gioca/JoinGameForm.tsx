"use client";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const joinGameSchema = z.object({
  gameCode: z
    .string()
    .length(4, "Il codice deve essere di 4 caratteri")
    .regex(/^[A-Z0-9]{4}$/, "Codice non valido"),
});

type JoinGameFormValues = z.infer<typeof joinGameSchema>;

export const JoinGameForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const joinGameMutation = useMutation(api.mutations.games.joinGame);

  const form = useForm<JoinGameFormValues>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: { gameCode: "" },
    mode: "onChange",
  });
  const { handleSubmit } = form;

  const handleJoinGame = async (values: JoinGameFormValues) => {
    setLoading(true);
    try {
      const gameId = await joinGameMutation({
        code: values.gameCode,
      });

      toast.success("Unito alla partita!", {
        description: `Codice: ${values.gameCode}`,
      });

      router.push(`/game/${values.gameCode}`);
    } catch (error: unknown) {
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Impossibile unirsi alla partita",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleJoinGame)}
        className="space-y-4"
        autoComplete="off"
      >
        <FormField
          name="gameCode"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice partita</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <CardFooter className="p-0 pt-4">
          <Button
            type="submit"
            disabled={loading || !form.formState.isValid}
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            Unisciti
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
};
