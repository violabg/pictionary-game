import { LLM_MODEL } from "@/lib/utils";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

interface ValidateGuessParams {
  guess: string;
  correctAnswer: string;
  category: string;
}

interface ValidationResult {
  isCorrect: boolean;
  explanation: string;
  submissionTimestamp: number;
}

export async function validateGuess(
  params: ValidateGuessParams
): Promise<ValidationResult> {
  const { guess, correctAnswer, category } = params;

  if (!guess || !correctAnswer || !category) {
    throw new Error("Missing required parameters for guess validation");
  }

  const timestamp = Date.now();

  // Schema for AI response
  const schema = z.object({
    isAcceptable: z.boolean(),
    explanation: z.string(),
  });

  // Category-specific validation instructions
  const categoryInstructions = {
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

  const result = await generateObject({
    model: groq(LLM_MODEL),
    prompt: `Sei un giudice esperto nel gioco Pictionary, specializzato nella categoria "${category}".
            ${
              categoryInstructions[
                category as keyof typeof categoryInstructions
              ] || ""
            }

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
    schema,
  });
  console.log("🚀 ~ result:", result);

  return {
    isCorrect: result.object.isAcceptable,
    submissionTimestamp: timestamp,
    explanation: result.object.explanation,
  };
}
