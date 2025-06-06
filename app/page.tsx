import PictionAILogo from "@/assets";
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
      <div className="flex flex-col items-center gap-4">
        <PictionAILogo height={100} className="text-black dark:text-white" />
        <p className="max-w-md text-muted-foreground text-xl text-center">
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
          <div className="flex sm:flex-row flex-col justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/gioca">Inizia a giocare</Link>
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
