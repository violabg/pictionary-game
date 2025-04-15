"use server"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Initialize Supabase client for server-side operations
const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Supabase URL is missing")
  }

  if (!supabaseKey) {
    throw new Error("Supabase key is missing")
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Sample cards for different categories and difficulty levels
const sampleCards = {
  Animals: {
    easy: [
      { title: "Dog", description: "A common household pet that barks" },
      { title: "Cat", description: "A small furry pet that meows" },
      { title: "Fish", description: "An aquatic animal that swims" },
      { title: "Bird", description: "A feathered animal that flies" },
      { title: "Rabbit", description: "A small mammal with long ears" },
      { title: "Horse", description: "A large animal people ride" },
      { title: "Cow", description: "A farm animal that produces milk" },
      { title: "Pig", description: "A pink farm animal" },
    ],
    medium: [
      { title: "Elephant", description: "A large mammal with a long trunk and tusks" },
      { title: "Giraffe", description: "A tall African mammal with a very long neck" },
      { title: "Penguin", description: "A flightless bird that swims and lives in cold regions" },
      { title: "Lion", description: "A large wild cat with a mane (on males)" },
      { title: "Octopus", description: "A sea creature with eight arms" },
      { title: "Kangaroo", description: "An Australian animal that hops and has a pouch" },
      { title: "Zebra", description: "A striped horse-like animal" },
      { title: "Dolphin", description: "An intelligent marine mammal" },
    ],
    hard: [
      { title: "Platypus", description: "An egg-laying mammal with a duck-like bill" },
      { title: "Narwhal", description: "A whale with a long spiral tusk" },
      { title: "Axolotl", description: "A salamander that never fully matures" },
      { title: "Pangolin", description: "A scaly anteater that rolls into a ball" },
      { title: "Okapi", description: "Looks like a cross between a zebra and giraffe" },
      { title: "Blobfish", description: "A deep-sea fish with a gelatinous appearance" },
      { title: "Tarsier", description: "A small primate with enormous eyes" },
      { title: "Mantis Shrimp", description: "A colorful crustacean with powerful strikes" },
    ],
  },
  Food: {
    easy: [
      { title: "Apple", description: "A common red or green fruit" },
      { title: "Banana", description: "A yellow curved fruit" },
      { title: "Pizza", description: "A round flatbread with toppings" },
      { title: "Sandwich", description: "Food between two slices of bread" },
      { title: "Cookie", description: "A sweet baked treat" },
      { title: "Ice Cream", description: "A frozen dairy dessert" },
      { title: "Hamburger", description: "A ground beef patty in a bun" },
      { title: "Fries", description: "Fried potato sticks" },
    ],
    medium: [
      { title: "Sushi", description: "Japanese dish with rice and raw fish" },
      { title: "Taco", description: "Mexican dish with a folded tortilla" },
      { title: "Pasta", description: "Italian noodles with sauce" },
      { title: "Steak", description: "A cut of cooked beef" },
      { title: "Cupcake", description: "A small cake designed to serve one person" },
      { title: "Burrito", description: "A wrapped Mexican dish with fillings" },
      { title: "Salad", description: "A dish of mixed vegetables" },
      { title: "Pancakes", description: "Flat cakes cooked on a griddle" },
    ],
    hard: [
      { title: "Ratatouille", description: "A French vegetable stew" },
      { title: "Soufflé", description: "A baked egg dish that rises" },
      { title: "Pho", description: "Vietnamese noodle soup" },
      { title: "Tiramisu", description: "Italian coffee-flavored dessert" },
      { title: "Paella", description: "Spanish rice dish with saffron" },
      { title: "Baklava", description: "Sweet pastry with layers of filo and nuts" },
      { title: "Kimchi", description: "Korean fermented vegetables" },
      { title: "Coq au Vin", description: "French chicken dish cooked with wine" },
    ],
  },
  Sports: {
    easy: [
      { title: "Soccer", description: "A game played with a round ball by two teams" },
      { title: "Basketball", description: "A game where players shoot a ball through a hoop" },
      { title: "Baseball", description: "A game with a bat and ball" },
      { title: "Tennis", description: "A game played with rackets and a ball" },
      { title: "Golf", description: "A game where players hit a small ball into holes" },
      { title: "Swimming", description: "Moving through water using limbs" },
      { title: "Running", description: "Moving rapidly on foot" },
      { title: "Cycling", description: "Riding a bicycle" },
    ],
    medium: [
      { title: "Volleyball", description: "A game where teams hit a ball over a net" },
      { title: "Skiing", description: "Sliding down snow-covered slopes on skis" },
      { title: "Surfing", description: "Riding waves on a board" },
      { title: "Hockey", description: "A game played with sticks and a puck" },
      { title: "Boxing", description: "A combat sport with gloves" },
      { title: "Gymnastics", description: "Athletic exercises requiring balance and strength" },
      { title: "Rowing", description: "Propelling a boat using oars" },
      { title: "Archery", description: "Shooting arrows with a bow" },
    ],
    hard: [
      { title: "Curling", description: "A game where stones are slid on ice" },
      { title: "Fencing", description: "A combat sport using swords" },
      { title: "Lacrosse", description: "A team sport with a ball and netted sticks" },
      { title: "Parkour", description: "Moving rapidly through an area, negotiating obstacles" },
      { title: "Water Polo", description: "A team water sport with a ball" },
      { title: "Sepak Takraw", description: "A kick volleyball game from Southeast Asia" },
      { title: "Biathlon", description: "A winter sport combining skiing and shooting" },
      { title: "Hurling", description: "An Irish field sport with sticks and a ball" },
    ],
  },
  Movies: {
    easy: [
      { title: "Titanic", description: "A ship that sinks on its maiden voyage" },
      { title: "Lion King", description: "Animated film about a young lion prince" },
      { title: "Frozen", description: "Animated film about a queen with ice powers" },
      { title: "Spider-Man", description: "Superhero with spider-like abilities" },
      { title: "Batman", description: "Superhero who fights crime in Gotham City" },
      { title: "Harry Potter", description: "Boy wizard who attends a magical school" },
      { title: "Finding Nemo", description: "Animated film about a lost clownfish" },
      { title: "Toy Story", description: "Animated film about toys that come to life" },
    ],
    medium: [
      { title: "Jurassic Park", description: "A theme park with dinosaurs" },
      { title: "Star Wars", description: "Space fantasy with lightsabers and the Force" },
      { title: "Avengers", description: "Superheroes teaming up to save the world" },
      { title: "Matrix", description: "A virtual reality controlled by machines" },
      { title: "Inception", description: "Entering dreams to plant ideas" },
      { title: "Forrest Gump", description: "A man who witnesses historical events" },
      { title: "Shrek", description: "Animated film about an ogre" },
      { title: "Jaws", description: "A giant shark terrorizing a beach town" },
    ],
    hard: [
      { title: "Citizen Kane", description: "Classic film about a newspaper tycoon" },
      { title: "Pulp Fiction", description: "Non-linear crime stories" },
      { title: "Casablanca", description: "Classic romance set during World War II" },
      { title: "Psycho", description: "Hitchcock thriller set in a motel" },
      { title: "Schindler's List", description: "Businessman saving Jews during the Holocaust" },
      { title: "Parasite", description: "Korean film about class inequality" },
      { title: "The Godfather", description: "Epic about an Italian-American crime family" },
      { title: "2001: A Space Odyssey", description: "Sci-fi epic about human evolution" },
    ],
  },
  Technology: {
    easy: [
      { title: "Computer", description: "Electronic device for processing data" },
      { title: "Smartphone", description: "Mobile phone with advanced features" },
      { title: "Keyboard", description: "Device with keys for typing" },
      { title: "Mouse", description: "Hand-controlled pointing device" },
      { title: "Printer", description: "Device that puts text/images on paper" },
      { title: "Headphones", description: "Device worn over ears to listen to audio" },
      { title: "Camera", description: "Device for taking photographs" },
      { title: "Television", description: "Device for watching broadcasts" },
    ],
    medium: [
      { title: "Robot", description: "Mechanical device that can perform tasks" },
      { title: "Drone", description: "Flying device controlled remotely" },
      { title: "Virtual Reality", description: "Computer-generated simulation of an environment" },
      { title: "Bluetooth", description: "Wireless technology for data exchange" },
      { title: "Wi-Fi", description: "Wireless networking technology" },
      { title: "Smartwatch", description: "Wearable computer on the wrist" },
      { title: "3D Printer", description: "Device that creates three-dimensional objects" },
      { title: "Tablet", description: "Portable touchscreen computer" },
    ],
    hard: [
      { title: "Blockchain", description: "Distributed ledger technology" },
      { title: "Quantum Computer", description: "Computer using quantum mechanics" },
      { title: "Neural Network", description: "Computing system inspired by brains" },
      { title: "Cryptocurrency", description: "Digital or virtual currency" },
      { title: "Augmented Reality", description: "Enhanced version of reality using technology" },
      { title: "Algorithm", description: "Step-by-step procedure for calculations" },
      { title: "Biometrics", description: "Measurement and analysis of physical characteristics" },
      { title: "Nanotechnology", description: "Manipulation of matter on an atomic scale" },
    ],
  },
  Geography: {
    easy: [
      { title: "Mountain", description: "Large landform that rises above surroundings" },
      { title: "River", description: "Natural flowing watercourse" },
      { title: "Beach", description: "Shore of a body of water covered by sand or pebbles" },
      { title: "Island", description: "Land surrounded by water" },
      { title: "Desert", description: "Barren area with little precipitation" },
      { title: "Forest", description: "Large area covered with trees" },
      { title: "Lake", description: "Body of water surrounded by land" },
      { title: "Volcano", description: "Mountain that erupts lava" },
    ],
    medium: [
      { title: "Canyon", description: "Deep gorge between cliffs" },
      { title: "Glacier", description: "Persistent body of ice moving under its weight" },
      { title: "Peninsula", description: "Land surrounded by water on three sides" },
      { title: "Waterfall", description: "Water falling from a height" },
      { title: "Reef", description: "Ridge of rock or coral near the surface of water" },
      { title: "Savanna", description: "Grassy plain with few trees" },
      { title: "Fjord", description: "Long, narrow sea inlet with steep sides" },
      { title: "Delta", description: "Landform at the mouth of a river" },
    ],
    hard: [
      { title: "Archipelago", description: "Group of islands" },
      { title: "Atoll", description: "Ring-shaped coral reef" },
      { title: "Mesa", description: "Elevated area with a flat top" },
      { title: "Escarpment", description: "Long, steep slope at edge of a plateau" },
      { title: "Isthmus", description: "Narrow strip of land connecting two larger areas" },
      { title: "Moraine", description: "Accumulation of debris carried by a glacier" },
      { title: "Butte", description: "Isolated hill with steep sides" },
      { title: "Karst", description: "Landscape formed by dissolution of soluble rocks" },
    ],
  },
  Music: {
    easy: [
      { title: "Guitar", description: "Stringed instrument played with fingers or pick" },
      { title: "Piano", description: "Keyboard instrument with hammers that strike strings" },
      { title: "Drum", description: "Percussion instrument struck with hands or sticks" },
      { title: "Microphone", description: "Device for converting sound into electrical signals" },
      { title: "Headphones", description: "Device worn over ears to listen to audio" },
      { title: "Radio", description: "Device for receiving broadcast audio signals" },
      { title: "Singer", description: "Person who uses their voice to make music" },
      { title: "Concert", description: "Live music performance" },
    ],
    medium: [
      { title: "Saxophone", description: "Brass instrument with a reed" },
      { title: "Violin", description: "Stringed instrument played with a bow" },
      { title: "Trumpet", description: "Brass instrument with three valves" },
      { title: "Orchestra", description: "Large ensemble of instruments" },
      { title: "Conductor", description: "Person who directs an orchestra" },
      { title: "Synthesizer", description: "Electronic instrument that generates sounds" },
      { title: "Metronome", description: "Device that produces regular ticks for timing" },
      { title: "Amplifier", description: "Device that increases the power of a signal" },
    ],
    hard: [
      { title: "Theremin", description: "Electronic instrument played without touching" },
      { title: "Oboe", description: "Double reed woodwind instrument" },
      { title: "Sitar", description: "Stringed instrument from India" },
      { title: "Didgeridoo", description: "Wind instrument developed by Indigenous Australians" },
      { title: "Harpsichord", description: "Keyboard instrument where strings are plucked" },
      { title: "Counterpoint", description: "Relationship between voices that are harmonically interdependent" },
      { title: "Fugue", description: "Contrapuntal compositional technique" },
      { title: "Gamelan", description: "Traditional ensemble music of Java and Bali" },
    ],
  },
  Art: {
    easy: [
      { title: "Painting", description: "Picture made with paint" },
      { title: "Sculpture", description: "Three-dimensional art made by shaping material" },
      { title: "Drawing", description: "Picture made with pencil, pen, or crayon" },
      { title: "Canvas", description: "Surface for painting" },
      { title: "Brush", description: "Tool for applying paint" },
      { title: "Palette", description: "Surface for mixing colors" },
      { title: "Museum", description: "Building where art is displayed" },
      { title: "Portrait", description: "Artistic representation of a person" },
    ],
    medium: [
      { title: "Mosaic", description: "Picture made from small pieces of colored material" },
      { title: "Collage", description: "Art made by sticking various materials on a surface" },
      { title: "Pottery", description: "Objects made from clay and hardened by heat" },
      { title: "Mural", description: "Large artwork painted on a wall" },
      { title: "Watercolor", description: "Painting method using water-soluble paint" },
      { title: "Abstract", description: "Art that does not attempt to represent reality" },
      { title: "Perspective", description: "Technique for creating illusion of depth" },
      { title: "Fresco", description: "Painting done on wet plaster" },
    ],
    hard: [
      { title: "Chiaroscuro", description: "Use of strong contrasts between light and dark" },
      { title: "Impasto", description: "Technique where paint is laid on thickly" },
      { title: "Lithography", description: "Printing method using stone or metal" },
      { title: "Pointillism", description: "Technique using small dots of color" },
      { title: "Trompe-l'œil", description: "Art that creates optical illusion of 3D" },
      { title: "Sfumato", description: "Painting technique for soft transitions" },
      { title: "Etching", description: "Process of using acid to cut into a metal surface" },
      { title: "Iconography", description: "Study of identification and interpretation of content of images" },
    ],
  },
}

// Function to get random cards from a specific category and difficulty
function getRandomCards(category: string, difficulty: string, count: number): any[] {
  // Get the category object
  const categoryCards = sampleCards[category as keyof typeof sampleCards]
  if (!categoryCards) {
    return []
  }

  let cardsPool: any[] = []

  if (difficulty === "mixed") {
    // Combine all difficulty levels
    cardsPool = [...categoryCards.easy, ...categoryCards.medium, ...categoryCards.hard]
  } else {
    // Get cards from the specific difficulty
    cardsPool = categoryCards[difficulty as keyof typeof categoryCards.easy] || []
  }

  // Shuffle the cards
  const shuffled = [...cardsPool].sort(() => 0.5 - Math.random())

  // Return the requested number of cards, or all if there aren't enough
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// Seed cards for a game
export async function seedCardsForGame(gameId: string, category: string, difficulty = "medium"): Promise<void> {
  try {
    const supabase = getSupabaseServerClient()

    // Get cards for the selected category and difficulty
    // We'll generate at least 10 cards per game, or more if there are more players
    const cards = getRandomCards(category, difficulty, 20)

    if (cards.length === 0) {
      throw new Error(`No cards available for category ${category} and difficulty ${difficulty}`)
    }

    // Insert cards into database
    const cardsToInsert = cards.map((card) => ({
      id: crypto.randomUUID(),
      game_id: gameId,
      title: card.title,
      description: card.description,
      used: false,
    }))

    const { error: insertError } = await supabase.from("cards").insert(cardsToInsert)

    if (insertError) {
      console.error("Error inserting cards:", insertError)
      throw new Error("Failed to seed cards")
    }

    // Mark cards as generated
    await supabase.from("games").update({ cards_generated: true }).eq("id", gameId)

    console.log(`Successfully seeded ${cards.length} cards for game ${gameId}`)
  } catch (error: any) {
    console.error("Error in seedCardsForGame:", error)
    throw new Error(error.message || "Failed to seed cards")
  }
}

// Get count of cards for a game
export async function getCardCount(gameId: string): Promise<number> {
  try {
    const supabase = getSupabaseServerClient()

    const { count, error } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId)

    if (error) {
      console.error("Error counting cards:", error)
      throw new Error("Failed to count cards")
    }

    return count || 0
  } catch (error: any) {
    console.error("Error in getCardCount:", error)
    throw new Error(error.message || "Failed to count cards")
  }
}
