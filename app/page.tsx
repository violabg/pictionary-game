import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center space-y-8 py-12 min-h-screen container">
      <div className="space-y-4 text-center">
        <h1 className="font-bold text-gradient text-5xl tracking-tight">
          Pictionary
        </h1>
        <p className="max-w-md text-muted-foreground text-xl">
          Un gioco multiplayer in tempo reale di disegno e indovinelli
        </p>
      </div>

      <Card className="w-full max-w-md" glass gradientBorder>
        <CardHeader>
          <CardTitle>Inizia una nuova partita</CardTitle>
          <CardDescription>
            Crea una nuova partita di Pictionary e invita i tuoi amici a
            partecipare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/new-game" className="w-full">
            <Button variant="gradient" size="lg" className="w-full">
              Crea partita
            </Button>
          </Link>
          <Link href="/join" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              Unisciti ad una partita
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
