import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateGameForm } from "./CreateGameForm";
import { JoinGameForm } from "./JoinGameForm";

export default function GiocaPage() {
  return (
    <main className="flex-1 py-12 container">
      <div className="mb-10 text-center">
        <h1 className="mb-2 font-display text-5xl tracking-wide">
          Scegli la tua mossa
        </h1>
        <p className="font-medium text-muted-foreground">
          Crea una nuova sfida o unisciti a una partita esistente
        </p>
      </div>
      <div className="gap-8 grid md:grid-cols-2 mx-auto max-w-3xl">
        <Card
          className="bg-card border-3 border-foreground"
          style={{
            boxShadow: "6px 6px 0 0 var(--color-yellow)",
            borderColor: "var(--color-yellow)",
          }}
        >
          <CardHeader>
            <div className="mb-1 text-4xl">🎨</div>
            <CardTitle className="font-display text-2xl tracking-wide">
              Crea una partita
            </CardTitle>
            <CardDescription className="font-medium">
              Imposta una nuova sfida e invita i tuoi amici
            </CardDescription>
          </CardHeader>
          <CreateGameForm />
        </Card>
        <Card
          className="bg-card border-3 border-foreground"
          style={{
            boxShadow: "6px 6px 0 0 var(--color-coral)",
            borderColor: "var(--color-coral)",
          }}
        >
          <CardHeader>
            <div className="mb-1 text-4xl">🕹️</div>
            <CardTitle className="font-display text-2xl tracking-wide">
              Unisciti
            </CardTitle>
            <CardDescription className="font-medium">
              Inserisci il codice partita per unirti
            </CardDescription>
          </CardHeader>
          <JoinGameForm />
        </Card>
      </div>
    </main>
  );
}
