"use client";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { categories } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const createGameSchema = z.object({
  category: z.string().min(1, "La categoria è obbligatoria"),
  maxRounds: z.coerce
    .number<number>()
    .int()
    .min(1, "Il numero di round deve essere almeno 1")
    .max(10, "Il numero di round deve essere al massimo 10"),
});

type CreateGameFormValues = z.infer<typeof createGameSchema>;

export const CreateGameForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const createGameMutation = useMutation(api.mutations.games.createGame);

  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      category: "",
      maxRounds: 5,
    },
    mode: "onChange",
  });
  const {
    handleSubmit,
    formState: { errors },
  } = form;

  const handleCreateGame = async (values: CreateGameFormValues) => {
    setLoading(true);
    try {
      const result = await createGameMutation({
        category: values.category,
        max_rounds: values.maxRounds,
      });

      toast.success("Partita creata!", {
        description: `Codice: ${result.code}`,
      });

      router.push(`/game/${result.code}`);
    } catch (error: unknown) {
      toast.error("Errore", {
        description:
          error instanceof Error
            ? error.message
            : "Impossibile creare la partita",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardContent>
        <form className="space-y-4" autoComplete="off">
          <FieldGroup>
            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category">Categoria</FieldLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={field.onChange}
                    required
                  >
                    <SelectTrigger
                      id="category"
                      className="[&[data-placeholder]]:text-muted-foreground glass-card"
                      aria-required={true}
                      aria-invalid={!!fieldState.error}
                      data-invalid={!!fieldState.error}
                    >
                      <SelectValue>
                        {(value) => value || "Seleziona una categoria"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Le carte verranno generate in base a questa categoria
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError
                      errors={errors.category ? [errors.category] : []}
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              name="maxRounds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="maxRounds">Numero di round</FieldLabel>
                  <Input
                    id="maxRounds"
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    disabled={loading}
                    className="glass-card"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldDescription>
                    Ogni giocatore disegnerà una volta per round
                  </FieldDescription>
                  <FieldError
                    errors={errors.maxRounds ? [errors.maxRounds] : []}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          disabled={loading}
          className="w-full"
          onClick={handleSubmit(handleCreateGame)}
        >
          {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
          Crea partita
        </Button>
      </CardFooter>
    </>
  );
};
