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
    <main className="flex-1 py-8 container">
      <div className="gap-8 grid md:grid-cols-2">
        <Card className="gradient-border glass-card">
          <CardHeader>
            <CardTitle>Crea una nuova partita</CardTitle>
            <CardDescription>Imposta una nuova sfida</CardDescription>
          </CardHeader>
          <CreateGameForm />
        </Card>
        <Card className="gradient-border glass-card">
          <CardHeader>
            <CardTitle>Unisciti a una partita</CardTitle>
            <CardDescription>
              Inserisci un codice partita per unirti a una partita esistente
            </CardDescription>
          </CardHeader>
          <JoinGameForm />
        </Card>
      </div>
    </main>
  );
}
