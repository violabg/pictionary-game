"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
  const {
    handleSubmit,
    register,
    formState: { errors, isValid },
  } = form;

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
    <form
      onSubmit={handleSubmit(handleJoinGame)}
      className="flex flex-col flex-1 gap-4"
      autoComplete="off"
    >
      <CardContent className="flex-1 pt-6">
        <FieldGroup>
          <Field data-invalid={!!errors.gameCode}>
            <FieldLabel htmlFor="gameCode">Codice partita</FieldLabel>
            <Input
              id="gameCode"
              placeholder="ES: ABCD"
              maxLength={4}
              variant="secondary"
              className="font-display font-bold text-center uppercase tracking-[0.25em]"
              {...register("gameCode", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              disabled={loading}
              aria-invalid={!!errors.gameCode}
            />
            <FieldError errors={errors.gameCode ? [errors.gameCode] : []} />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="bg-secondary/5 mt-4 pt-6 border-foreground border-t-4">
        <Button
          type="submit"
          disabled={loading || !isValid}
          variant="secondary"
          className="w-full"
        >
          {loading ? <Loader2 className="mr-2 w-6 h-6 animate-spin" /> : null}
          Unisciti all&apos;azione
        </Button>
      </CardFooter>
    </form>
  );
};
