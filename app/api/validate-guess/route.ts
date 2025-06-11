import { validateGuess } from "@/lib/utils/guess-validation";
import { NextResponse } from "next/server";

interface ValidateGuessPayload {
  guess: string;
  correctAnswer: string;
  category: string;
}

export async function POST(req: Request) {
  try {
    const { guess, correctAnswer, category }: ValidateGuessPayload =
      await req.json();

    const result = await validateGuess({ guess, correctAnswer, category });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error validating guess:", error);
    return NextResponse.json(
      {
        error: "Failed to validate guess",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
