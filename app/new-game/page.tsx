"use client";

import type React from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGame } from "@/lib/game-actions";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const categories = [
  "Animals",
  "Food",
  "Movies",
  "Sports",
  "Technology",
  "Geography",
  "Music",
  "Art",
];
const difficulties = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

export default function NewGamePage() {
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const router = useRouter();

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsSetup(false);

    if (!username || !category) {
      toast({
        title: "Missing information",
        description: "Please provide your username and select a category",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const gameId = await createGame(username, category, difficulty);
      if (!gameId) {
        throw new Error("No game ID returned");
      }

      // Store player ID in localStorage as well for client-side access
      const playerId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("playerId="))
        ?.split("=")[1];

      if (playerId) {
        localStorage.setItem("playerId", playerId);
      }

      router.push(`/game/${gameId}`);
    } catch (err: any) {
      console.error("Error creating game:", err);

      // Check if the error is related to missing tables
      if (err.message && err.message.includes("tables not set up")) {
        setNeedsSetup(true);
      }

      setError(err.message || "Failed to create game. Please try again.");
      toast.error("Error", {
        description: err.message || "Failed to create game. Please try again.",
      });
      setIsLoading(false);
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
            <CardTitle>Create New Game</CardTitle>
            <CardDescription>
              Set up a new Pictionary game and generate cards
            </CardDescription>
          </CardHeader>
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {needsSetup && (
            <div className="mb-4 px-6">
              <Alert>
                <AlertTitle>Database Setup Required</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    The database tables need to be created first.
                  </p>
                  <Link href="/setup" className="text-primary underline">
                    Click here to set up the database
                  </Link>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <form onSubmit={handleCreateGame}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Your Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category" className="glass-card">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                  Cards will be generated based on this category
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={difficulty}
                  onValueChange={setDifficulty}
                  required
                >
                  <SelectTrigger id="difficulty" className="glass-card">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((diff) => (
                      <SelectItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                  {difficulty === "easy"
                    ? "Simple words that are easy to draw and guess"
                    : difficulty === "medium"
                    ? "Moderate difficulty words for a balanced game"
                    : difficulty === "hard"
                    ? "Challenging words that are harder to draw and guess"
                    : "Random selection from all difficulty levels"}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Game..." : "Create Game"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
