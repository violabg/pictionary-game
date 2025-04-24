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
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sqlScript, setSqlScript] = useState<string | null>(null);
  const router = useRouter();

  const handleSetup = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setSqlScript(null);

    try {
      // Execute the SQL script to create tables
      const response = await fetch("/api/setup-database", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up database");
      }

      if (data.sql) {
        // We need to show the SQL script for manual execution
        setSqlScript(data.sql);
        setError(
          "Automatic setup failed. Please run the SQL script manually in the Supabase SQL editor."
        );
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Error setting up database:", err);
      setError(err.message || "Failed to set up database. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 min-h-screen container">
      <div className="w-full max-w-2xl">
        <Link href="/" className="inline-block mb-4">
          <Button variant="glass" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Button>
        </Link>

        <Card className="gradient-border w-full glass-card">
          <CardHeader>
            <CardTitle>Configurazione Database</CardTitle>
            <CardDescription>
              Imposta le tabelle del database per il gioco Pictionary
            </CardDescription>
          </CardHeader>
          {error && (
            <div className="mb-4 px-6">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {success && (
            <div className="mb-4 px-6">
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-500">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <AlertTitle>Successo</AlertTitle>
                <AlertDescription>
                  Le tabelle del database sono state create con successo.
                  <div className="mt-2">
                    <Link href="/new-game" className="text-primary underline">
                      Crea una nuova partita
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <CardContent className="space-y-4">
            <p>
              Questo comando crea le tabelle necessarie per il gioco Pictionary.
              È necessario eseguirlo solo una volta.
            </p>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">Istruzioni:</h3>
              <ol className="space-y-2 pl-5 list-decimal">
                <li>
                  Assicurati che il tuo progetto Supabase sia configurato e che
                  le variabili d'ambiente siano impostate.
                </li>
                <li>
                  Clicca sul pulsante "Configura Database" qui sotto per creare
                  le tabelle richieste.
                </li>
                <li>
                  Se la configurazione automatica fallisce, ti verrà fornito uno
                  script SQL da eseguire manualmente nell'editor SQL di
                  Supabase.
                </li>
              </ol>
            </div>

            {sqlScript && (
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-lg">
                  Configurazione manuale necessaria
                </h3>
                <p>
                  Copia lo script SQL qui sotto ed eseguilo nell'editor SQL di
                  Supabase:
                </p>
                <Textarea
                  value={sqlScript}
                  readOnly
                  className="h-64 overflow-auto font-mono text-sm glass-card"
                  onClick={(e) => {
                    const textarea = e.target as HTMLTextAreaElement;
                    textarea.select();
                    document.execCommand("copy");
                    alert("SQL copiato negli appunti!");
                  }}
                />
                <p className="text-muted-foreground text-sm">
                  Clicca nell'area di testo per selezionare e copiare tutto lo
                  script SQL.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSetup}
              variant="gradient"
              className="w-full"
              disabled={isLoading || success}
            >
              {isLoading
                ? "Configurazione in corso..."
                : success
                ? "Configurazione completata"
                : "Configura Database"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
