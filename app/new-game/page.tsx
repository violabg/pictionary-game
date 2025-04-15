"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
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
import { createGame } from "@/lib/game-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
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

const schema = z.object({
  username: z.string().min(2, "Il nome utente è obbligatorio"),
  category: z.string().min(1, "La categoria è obbligatoria"),
  difficulty: z.string().min(1, "La difficoltà è obbligatoria"),
});

type FormValues = z.infer<typeof schema>;

export default function NewGamePage() {
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const router = useRouter();

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      category: "",
      difficulty: "medio",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setNeedsSetup(false);
    try {
      const gameId = await createGame(
        data.username,
        data.category,
        data.difficulty
      );
      if (!gameId) throw new Error("No game ID returned");
      const playerId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("playerId="))
        ?.split("=")[1];
      if (playerId) localStorage.setItem("playerId", playerId);
      router.push(`/game/${gameId}`);
    } catch (err: any) {
      console.error("Error creating game:", err);
      if (err.message && err.message.includes("tables not set up"))
        setNeedsSetup(true);
      setError(err.message || "Failed to create game. Please try again.");
      toast.error("Error", {
        description: err.message || "Failed to create game. Please try again.",
      });
    }
  };

  return (
    <div className="flex justify-center items-center py-12 min-h-screen container">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-4">
          <Button variant="glass" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
        <Card className="gradient-border w-full glass-card">
          <CardHeader>
            <CardTitle>Crea una nuova partita</CardTitle>
            <CardDescription>
              Imposta una nuova partita di Pictionary e genera le carte
            </CardDescription>
          </CardHeader>
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {needsSetup && (
            <div className="mb-4 px-6">
              <Alert>
                <AlertTitle>Configurazione database necessaria</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    È necessario prima creare le tabelle del database.
                  </p>
                  <Link href="/setup" className="text-primary underline">
                    Clicca qui per configurare il database
                  </Link>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome utente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Inserisci il tuo nome utente"
                          {...field}
                          className="glass-card"
                        />
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
              </CardContent>
              <CardFooter className="mt-4">
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creazione partita..." : "Crea partita"}
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        </Card>
      </div>
    </div>
  );
}
