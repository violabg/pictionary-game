"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface GuessInputProps {
  onSubmit: (guess: string) => void
  disabled?: boolean
}

export default function GuessInput({ onSubmit, disabled = false }: GuessInputProps) {
  const [guess, setGuess] = useState("")
  const [lastGuess, setLastGuess] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guess.trim()) return

    setLastGuess(guess.trim())
    onSubmit(guess.trim())
    setGuess("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        type="text"
        placeholder="Type your guess here..."
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        disabled={disabled}
        className="flex-grow glass-card"
      />
      <Button type="submit" variant="gradient" disabled={disabled || !guess.trim()}>
        <Send className="h-4 w-4 mr-2" />
        Guess
      </Button>
    </form>
  )
}
