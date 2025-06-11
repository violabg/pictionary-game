"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

interface GuessInputProps {
  onSubmit: (guess: string) => Promise<void>;
  disabled?: boolean;
}

export default function GuessInput({
  onSubmit,
  disabled = false,
}: GuessInputProps) {
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onSubmit(guess.trim());
      setGuess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        type="text"
        placeholder="Scrivi qui il tuo tentativo..."
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        disabled={disabled || isSubmitting}
        className="grow glass-card"
      />
      <Button
        type="submit"
        variant="gradient"
        disabled={disabled || !guess.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Verifica...
          </>
        ) : (
          <>
            <Send className="mr-2 w-4 h-4" />
            Invia
          </>
        )}
      </Button>
    </form>
  );
}
