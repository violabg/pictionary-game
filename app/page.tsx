import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight gradient-text">Pictionary</h1>
        <p className="text-xl text-muted-foreground max-w-md">A real-time multiplayer drawing and guessing game</p>
      </div>

      <Card className="w-full max-w-md glass-card gradient-border">
        <CardHeader>
          <CardTitle>Start a new game</CardTitle>
          <CardDescription>Create a new Pictionary game and invite your friends to join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/new-game" className="w-full">
            <Button variant="gradient" size="lg" className="w-full">
              Create Game
            </Button>
          </Link>
          <Link href="/join" className="w-full">
            <Button variant="glass" size="lg" className="w-full">
              Join Game
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
