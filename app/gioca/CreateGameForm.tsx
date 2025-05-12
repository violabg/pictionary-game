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
import { addPlayerToGame } from "@/lib/supabase/supabase-game-players";
import { createGame } from "@/lib/supabase/supabase-games";
import { ensureUserProfile } from "@/lib/supabase/supabase-profiles";
import { zodResolver } from "@hookform/resolvers/zod";

import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const categories = [
  "Animali",
  "Cibo",
  "Film",
  "Sport",
  "Tecnologia",
  "Geografia",
  "Musica",
  "Arte",
];
const difficulties = [
  { value: "facile", label: "Facile" },
  { value: "medio", label: "Medio" },
  { value: "difficile", label: "Difficile" },
  { value: "random", label: "Casuale" },
];

const createGameSchema = z.object({
  maxPlayers: z.coerce
    .number()
    .min(2, "Il numero massimo di giocatori è obbligatorio"),
  category: z.string().min(1, "La categoria è obbligatoria"),
  difficulty: z.string().min(1, "La difficoltà è obbligatoria"),
  timer: z.coerce
    .number()
    .min(30, "Il timer deve essere almeno 30 secondi")
    .max(600, "Il timer deve essere al massimo 600 secondi"),
});

type CreateGameForm = z.infer<typeof createGameSchema>;

export const CreateGameForm = ({ user }: { user: User }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<CreateGameForm>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      maxPlayers: 2,
      category: "",
      difficulty: "medio",
      timer: 120,
    },
    mode: "onChange",
  });
  const { handleSubmit } = form;

  const handleCreateGame = async (values: CreateGameForm) => {
    if (!user) return;
    setLoading(true);
    try {
      const profileExists = await ensureUserProfile(user);
      if (!profileExists) return;
      const { data, error } = await createGame(
        user.id,
        values.maxPlayers,
        values.category,
        values.difficulty,
        values.timer
      );
      if (error) throw error;
      await addPlayerToGame(data.id, user.id, 1);
      router.push(`/game/${data.code}`);
    } catch (error: unknown) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : String(error),
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
          name="maxPlayers"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero massimo di giocatori</FormLabel>
              <FormControl>
                <Input type="number" min={2} disabled={loading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficoltà</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  required
                >
                  <SelectTrigger id="difficulty" className="glass-card">
                    <SelectValue placeholder="Seleziona la difficoltà" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((diff) => (
                      <SelectItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="text-muted-foreground text-sm">
                {field.value === "facile"
                  ? "Parole semplici, facili da disegnare e indovinare"
                  : field.value === "medio"
                  ? "Parole di difficoltà moderata per un gioco equilibrato"
                  : field.value === "difficile"
                  ? "Parole impegnative, più difficili da disegnare e indovinare"
                  : "Selezione casuale da tutti i livelli di difficoltà"}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="timer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timer (secondi)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={30}
                  max={600}
                  step={10}
                  {...field}
                  value={field.value ?? 120}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="glass-card"
                />
              </FormControl>
              <p className="text-muted-foreground text-sm">
                Imposta la durata del turno in secondi (default 120, minimo 30,
                massimo 600)
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
