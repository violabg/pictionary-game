import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col justify-center items-center space-y-8 py-12 min-h-screen container">
      <div className="space-y-4 text-center">
        <h1 className="font-bold text-gradient text-5xl tracking-tight">
          PictionAi
        </h1>
        <p className="max-w-md text-muted-foreground text-xl">
          Un gioco multiplayer in tempo reale di disegno e indovinelli
        </p>
      </div>

      <Card className="w-full max-w-md" glass gradientBorder>
        <CardHeader>
          <CardTitle>Inizia una nuova partita</CardTitle>
          <CardDescription>
            Crea una nuova partita di PictionAi e invita i tuoi amici a
            partecipare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex sm:flex-row flex-col gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">Inizia a giocare</Link>
            </Button>
            {!data?.user && (
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
