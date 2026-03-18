import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dices, KeyRound } from "lucide-react";
import { CreateGameForm } from "./CreateGameForm";
import { JoinGameForm } from "./JoinGameForm";

export default function GiocaPage() {
  return (
    <main className="relative flex-1 py-12 min-h-[calc(100vh-64px)] overflow-hidden container">
      <div className="top-10 right-10 absolute opacity-10 text-primary rotate-12 pointer-events-none">
        <Dices size={150} strokeWidth={1} />
      </div>
      <div className="bottom-10 left-10 absolute opacity-10 text-secondary -rotate-12 pointer-events-none">
        <KeyRound size={150} strokeWidth={1} />
      </div>

      <div className="z-10 relative space-y-8 mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="drop-shadow-[4px_4px_0_var(--color-secondary)] dark:drop-shadow-[4px_4px_0_var(--color-secondary)] font-display font-black text-foreground text-5xl md:text-7xl uppercase tracking-tight">
            Scegli il tuo <span className="text-primary italic">Destino</span>
          </h1>
        </div>

        <div className="gap-8 grid md:grid-cols-2">
          <Card variant="primary" className="group">
            <CardHeader className="bg-primary/10 pb-6 border-foreground border-b-4">
              <CardTitle className="flex justify-between items-center text-primary">
                Crea Partita <Dices className="group-hover:animate-bounce" />
              </CardTitle>
              <CardDescription className="mt-2 text-foreground">
                Imposta le regole e diventa il master.
              </CardDescription>
            </CardHeader>
            <CreateGameForm />
          </Card>

          <Card variant="secondary" className="group">
            <CardHeader className="bg-secondary/10 pb-6 border-foreground border-b-4">
              <CardTitle className="flex justify-between items-center text-secondary">
                Unisciti <KeyRound className="group-hover:animate-bounce" />
              </CardTitle>
              <CardDescription className="mt-2 text-foreground">
                Hai un codice? Entra in azione.
              </CardDescription>
            </CardHeader>
            <JoinGameForm />
          </Card>
        </div>
      </div>
    </main>
  );
}
