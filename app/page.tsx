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
        <h1 className="font-bold text-5xl tracking-tight gradient-text">
          Pictionary
        </h1>
        <p className="max-w-md text-muted-foreground text-xl">
          A real-time multiplayer drawing and guessing game
        </p>
      </div>

      <Card className="w-full max-w-md" glass gradientBorder>
        <CardHeader>
          <CardTitle>Start a new game</CardTitle>
          <CardDescription>
            Create a new Pictionary game and invite your friends to join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/new-game" className="w-full">
            <Button variant="gradient" size="lg" className="w-full">
              Create Game
            </Button>
          </Link>
          <Link href="/join" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              Join Game
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
