// This file is deprecated - use Convex queries directly in components
// Game state is now managed through:
// - api.queries.games.getGameByCode() - fetch game by code
// - api.queries.players.getPlayersForGame() - fetch all players
// - api.queries.turns.getCurrentTurn() - get current turn info
// - Subscriptions via useQuery() with real-time updates
//
// Example replacement:
// const game = useQuery(api.queries.games.getGameByCode, { code });
// const players = useQuery(api.queries.players.getPlayersForGame, game?._id ? { gameId: game._id } : "skip");
// const handleStartGame = async () => {
//   await startGame({ gameId: game._id });
// };

export {};
