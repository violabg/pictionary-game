"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";

type CardDisplayProps = {
  card: Doc<"cards"> | null;
};

export default function CardDisplay({ card }: CardDisplayProps) {
  return (
    <Card className="gradient-border glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">La tua parola da disegnare</CardTitle>
        <CardDescription>Non mostrarla agli altri giocatori!</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <div className="text-center">
          <h3 className="mb-1 font-bold text-gradient text-2xl">
            {card?.word}
          </h3>
          <p className="text-muted-foreground text-sm">{card?.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
