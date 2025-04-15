"use client"

import type { Card as CardType } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CardDisplayProps {
  card: CardType
}

export default function CardDisplay({ card }: CardDisplayProps) {
  return (
    <Card className="glass-card gradient-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Word to Draw</CardTitle>
        <CardDescription>Don't show this to other players!</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <div className="text-center">
          <h3 className="text-2xl font-bold gradient-text mb-1">{card.title}</h3>
          <p className="text-muted-foreground text-sm">{card.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
