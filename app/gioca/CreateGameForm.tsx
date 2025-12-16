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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const difficulties = [
  { value: "facile", label: "Facile" },
  { value: "medio", label: "Medio" },
  { value: "difficile", label: "Difficile" },
  { value: "random", label: "Casuale" },
];

const createGameSchema = z.object({
  category: z.string().min(1, "La categoria è obbligatoria"),
  maxRounds: z.coerce
    .number()
    .min(1, "Il numero di round deve essere almeno 1")
    .max(10, "Il numero di round deve essere al massimo 10")
    .default(5),
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
  const { handleSubmit } = form;

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
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleCreateGame)}
        className="space-y-4"
        autoComplete="off"
      >
        <FormField
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  required
                >
                  <SelectTrigger id="category" className="glass-card">
                    <SelectValue placeholder="Seleziona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="text-muted-foreground text-sm">
                Le carte verranno generate in base a questa categoria
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="maxRounds"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di round</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  {...field}
                  disabled={loading}
                  className="glass-card"
                />
              </FormControl>
              <p className="text-muted-foreground text-sm">
                Ogni giocatore disegnerà una volta per round
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <CardFooter className="p-0 pt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            Crea partita
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
};
