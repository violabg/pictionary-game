import { createClient } from "./client";
import type { TurnWithDetails } from "./types";

const supabase = await createClient();

// Get paginated game history with turns
export async function getGameHistory(
  userId: string,
  page: number = 1,
  limit: number = 10,
  category?: string
): Promise<{
  games: Array<{
    id: string;
    code: string;
    category: string;
    status: string;
    created_at: string;
    turns_count: number;
    user_score: number;
    total_turns: TurnWithDetails[];
    players: Array<{
      id: string;
      score: number;
      profile: {
        id: string;
        name: string | null;
        user_name: string | null;
        avatar_url: string | null;
      };
    }>;
  }>;
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;

  // First, get game IDs where user participated
  const gameIdsQuery = supabase
    .from("players")
    .select("game_id")
    .eq("player_id", userId);

  const { data: gameIds, error: gameIdsError } = await gameIdsQuery;

  if (gameIdsError) {
    console.error("Error fetching game IDs:", gameIdsError);
    throw new Error("Failed to fetch game IDs");
  }

  const gameIdList = gameIds?.map((p: { game_id: string }) => p.game_id) || [];

  if (gameIdList.length === 0) {
    return {
      games: [],
      total: 0,
      hasMore: false,
    };
  }

  // Build query for games with turns
  let query = supabase
    .from("games")
    .select(
      `
      id,
      code,
      category,
      status,
      created_at,
      turns(
        *,
        card:cards(*),
        drawer:profiles!turns_drawer_id_fkey(*),
        winner:profiles!turns_winner_id_fkey(*),
        game:games(*)
      )
    `
    )
    .in("id", gameIdList)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Add category filter if provided
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching game history:", error);
    throw new Error("Failed to fetch game history");
  }

  // Get user scores for each game
  const gameScores = new Map<string, number>();
  const gamePlayersMap = new Map<
    string,
    Array<{
      id: string;
      score: number;
      profile: {
        id: string;
        name: string | null;
        user_name: string | null;
        avatar_url: string | null;
      };
    }>
  >();

  for (const gameId of gameIdList) {
    // Get user score
    const { data: playerData } = await supabase
      .from("players")
      .select("score")
      .eq("game_id", gameId)
      .eq("player_id", userId)
      .single();

    if (playerData) {
      gameScores.set(gameId, playerData.score);
    }

    // Get all players for the game
    const { data: allPlayers } = await supabase
      .from("players")
      .select(
        `
        id,
        score,
        profile:player_id(id, name, user_name, avatar_url)
      `
      )
      .eq("game_id", gameId);

    if (allPlayers) {
      gamePlayersMap.set(
        gameId,
        allPlayers as Array<{
          id: string;
          score: number;
          profile: {
            id: string;
            name: string | null;
            user_name: string | null;
            avatar_url: string | null;
          };
        }>
      );
    }
  }

  // Get total count for pagination
  let countQuery = supabase
    .from("games")
    .select("id", { count: "exact", head: true })
    .in("id", gameIdList)
    .eq("status", "completed");

  if (category && category !== "all") {
    countQuery = countQuery.eq("category", category);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("Error counting games:", countError);
    throw new Error("Failed to count games");
  }

  const total = count || 0;
  const hasMore = offset + limit < total;

  // Process the data - winner information is already included in the query
  const processedGames =
    data?.map(
      (game: {
        id: string;
        code: string;
        category: string;
        status: string;
        created_at: string;
        turns: TurnWithDetails[];
      }) => {
        const userScore = gameScores.get(game.id) || 0;
        const players = gamePlayersMap.get(game.id) || [];

        return {
          id: game.id,
          code: game.code,
          category: game.category,
          status: game.status,
          created_at: game.created_at,
          turns_count: game.turns.length,
          user_score: userScore,
          total_turns: game.turns,
          players: players,
        };
      }
    ) || [];

  return {
    games: processedGames,
    total,
    hasMore,
  };
}

// Get available categories for the filter
export async function getGameCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("games")
    .select("category")
    .eq("status", "completed");

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }

  // Get unique categories
  const categories = [
    ...new Set(data.map((game: { category: string }) => game.category)),
  ];
  return categories.sort();
}
