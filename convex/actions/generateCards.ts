"use node";
import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

const cardSchema = z.object({
  word: z.string().describe("The word to draw"),
  description: z.string().describe("A brief description of the word"),
});

const FALLBACK_LIBRARY: Record<
  string,
  Array<{ word: string; description: string }>
> = {
  animals: [
    { word: "Cat", description: "A small, whiskered house pet that purrs" },
    { word: "Dog", description: "A loyal pet that wags its tail" },
    { word: "Elephant", description: "A huge animal with a trunk" },
    { word: "Giraffe", description: "Tall animal with a long neck" },
    { word: "Penguin", description: "A black and white bird that swims" },
    { word: "Kangaroo", description: "Jumps with a joey in its pouch" },
    { word: "Turtle", description: "Slow reptile with a hard shell" },
    { word: "Butterfly", description: "Insect with colorful wings" },
    { word: "Lion", description: "The king of the jungle" },
    { word: "Dolphin", description: "Smart sea mammal that leaps" },
  ],
  objects: [
    { word: "Bicycle", description: "Two-wheeled vehicle you pedal" },
    { word: "Umbrella", description: "Keeps you dry in the rain" },
    { word: "Laptop", description: "Portable computer with a keyboard" },
    { word: "Clock", description: "Shows the time with hands" },
    { word: "Backpack", description: "Bag you wear on your shoulders" },
    { word: "Glasses", description: "Worn to help you see" },
    { word: "Camera", description: "Takes photos with a click" },
    { word: "Balloon", description: "Inflatable and floats in the air" },
    { word: "Key", description: "Used to unlock a door" },
    { word: "Book", description: "Pages you read for stories" },
  ],
  actions: [
    { word: "Running", description: "Moving fast on foot" },
    { word: "Dancing", description: "Moving to music happily" },
    { word: "Cooking", description: "Preparing food in the kitchen" },
    { word: "Painting", description: "Using colors on a canvas" },
    { word: "Singing", description: "Making music with your voice" },
    { word: "Swimming", description: "Moving through water" },
    { word: "Reading", description: "Looking at words in a book" },
    { word: "Climbing", description: "Going up a wall or tree" },
    { word: "Jumping", description: "Leaping off the ground" },
    { word: "Drawing", description: "Sketching with pencil or pen" },
  ],
  food: [
    { word: "Pizza", description: "Cheesy slice with toppings" },
    { word: "Ice Cream", description: "Cold, sweet frozen dessert" },
    { word: "Hamburger", description: "Beef patty in a bun" },
    { word: "Sushi", description: "Rice rolls with fish" },
    { word: "Pancakes", description: "Fluffy breakfast cakes" },
    { word: "Apple", description: "Crisp red or green fruit" },
    { word: "Carrot", description: "Crunchy orange vegetable" },
    { word: "Spaghetti", description: "Long noodles with sauce" },
    { word: "Taco", description: "Folded tortilla with fillings" },
    { word: "Chocolate", description: "Sweet brown treat" },
  ],
  places: [
    { word: "Beach", description: "Sandy shore by the sea" },
    { word: "Mountain", description: "Tall rocky peak" },
    { word: "School", description: "Where students learn" },
    { word: "Zoo", description: "Animals in enclosures to see" },
    { word: "Park", description: "Green area with paths and benches" },
    { word: "Airport", description: "Planes take off and land here" },
    { word: "Museum", description: "Place with art or history" },
    { word: "Castle", description: "Fortified building with towers" },
    { word: "Farm", description: "Fields, animals, and barns" },
    { word: "Library", description: "Lots of books to borrow" },
  ],
};

const pickFallbackCards = (category: string, count: number) => {
  const key = category.toLowerCase();
  const pool = FALLBACK_LIBRARY[key] ?? [
    ...FALLBACK_LIBRARY.objects,
    ...FALLBACK_LIBRARY.animals,
    ...FALLBACK_LIBRARY.actions,
  ];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Generates a list of random cards from Groq API
 */
export const generateCards = action({
  args: {
    category: v.string(),
    count: v.number(),
  },
  returns: v.array(
    v.object({
      word: v.string(),
      description: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const cardsArray = z.array(cardSchema);
    const schema = z.union([z.object({ cards: cardsArray }), cardsArray]);

    // Guard rails for inputs
    const count = Math.max(1, Math.min(20, Math.floor(args.count)));
    const category = args.category.trim();

    // Query the last 50 cards for this category to avoid repetition
    const recentCards = await ctx.runQuery(
      api.queries.cards.getRecentCardsByCategory,
      {
        category,
        limit: 50,
      }
    );
    const recentWords = recentCards.map((card) => card.word);

    // Try structured generation with Groq models; allow env override
    const candidateModels = (process.env.GROQ_MODELS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const defaultCandidates = [
      // Update these defaults to currently supported models in your account
      "openai/gpt-oss-20b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ];
    const modelsToTry = candidateModels.length
      ? candidateModels
      : defaultCandidates;

    const systemHint = [
      `You are generating JSON for a Pictionary card set.`,
      `Return ONLY JSON that matches the provided schema exactly.`,
      `No prose, no code fences, no markdown, no comments.`,
    ].join(" ");

    const categoryInstructions =
      category.toLowerCase() === "film"
        ? "Generate movie titles as the words."
        : "Most words should be in Italian, except for technical terms or proper names.";

    const prompt = [
      systemHint,
      `Task: Generate ${count} varied, family-friendly drawing prompts in the "${category}" category.`,
      categoryInstructions,
      `Do NOT repeat any of these recently used words: ${recentWords.join(
        ", "
      )}.`,
      `Each card must contain:`,
      `- word: short, drawable concept (no proper names unless iconic)`,
      `- description: 6-12 words describing the concept to help the drawer`,
      `Required JSON structure example:`,
      `[{"word": "Gatto", "description": "Piccolo animale domestico con baffi che fa le fusa"}]`,
    ].join("\n");

    const tryGenerate = async () => {
      let lastError: unknown = null;
      for (const name of modelsToTry) {
        try {
          const { output } = await generateText({
            model: groq(name),
            output: Output.object({ schema }),
            prompt,
            temperature: 0.2,
          });
          return output;
        } catch (err) {
          lastError = err;
          console.warn(`[generateCards] Model failed: ${name}`, err);
        }
      }
      throw lastError ?? new Error("All models failed");
    };

    try {
      const object = await tryGenerate();
      const parsed = schema.parse(object);
      const cards = Array.isArray(parsed) ? parsed : parsed.cards;
      // Ensure we return exactly 'count' cards
      return cards.slice(0, count);
    } catch (finalErr) {
      console.error(
        "Structured generation failed, using fallback set:",
        finalErr
      );
      return pickFallbackCards(category, count);
    }
  },
});
