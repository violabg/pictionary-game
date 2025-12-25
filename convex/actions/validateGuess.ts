"use node";
import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { action } from "../_generated/server";

const schema = z.object({
  isAcceptable: z.boolean(),
  explanation: z.string(),
});

const categoryInstructions: Record<string, string> = {
  Animali:
    "Considera sinonimi comuni, nomi scientifici, variazioni regionali e sottospecie.",
  Cibo: "Considera varianti regionali dei nomi, ingredienti principali e piatti simili.",
  Film: "Considera titoli alternativi, traduzioni e variazioni minori.",
  Sport: "Considera termini tecnici, variazioni regionali e sinonimi comuni.",
  Tecnologia:
    "Considera acronimi, varianti ortografiche e termini tecnici equivalenti. Anche sinonimi in inglese sono accettabili.",
  Geografia:
    "Considera nomi alternativi, variazioni storiche e traslitterazioni.",
  Musica: "Considera generi musicali, strumenti e termini tecnici.",
  Arte: "Considera stili artistici, tecniche e termini specifici del settore.",
};

export const validateGuess = action({
  args: {
    guess: v.string(),
    correctAnswer: v.string(),
    category: v.string(),
  },
  returns: v.object({
    isCorrect: v.boolean(),
    explanation: v.string(),
    submissionTimestamp: v.number(),
  }),
  handler: async (ctx, args) => {
    const { guess, correctAnswer, category } = args;

    if (!guess || !correctAnswer || !category) {
      throw new Error("Missing required parameters for guess validation");
    }

    const timestamp = Date.now();

    const result = await generateText({
      model: groq("openai/gpt-oss-20b"),
      prompt: `Sei un giudice esperto nel gioco Pictionary, specializzato nella categoria "${category}".
            ${categoryInstructions[category] || ""}

            Determina se la risposta "${guess}" è accettabilmente simile alla risposta corretta "${correctAnswer}".

            CRITERI RIGOROSI:
            1. La risposta deve essere sostanzialmente corretta, non solo vagamente correlata
            2. Sinonimi devono essere DIRETTI e comunemente riconosciuti
            3. Errori di ortografia accettabili SOLO se non cambiano significativamente la parola
            4. Termini generici NON sono accettabili per risposte specifiche
            5. La risposta deve dimostrare chiaramente la conoscenza del concetto corretto

            Considera con maggiore rigore:
            - Sinonimi diretti e termini strettamente correlati (non generici)
            - Errori di ortografia minori che non alterano il significato
            - Variazioni linguistiche specifiche e riconosciute della categoria
            - Il livello di precisione deve essere alto per mantenere la sfida del gioco

            RIFIUTA risposte che sono:
            - Troppo generiche o vaghe
            - Solo parzialmente correlate
            - Categoria corretta ma elemento sbagliato
            - Termini che richiedono "interpretazione creativa"

            Rispondi con un oggetto JSON contenente:
            - isAcceptable: booleano che indica se la risposta è accettabile (sii più selettivo)
            - explanation: breve spiegazione della tua decisione (non mostrata al giocatore, solo per logging)`,
      output: Output.object({ schema }),
    });

    const validationResult = result.output as {
      isAcceptable: boolean;
      explanation: string;
    };

    return {
      isCorrect: validationResult.isAcceptable,
      submissionTimestamp: timestamp,
      explanation: validationResult.explanation,
    };
  },
});
