/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_generateCards from "../actions/generateCards.js";
import type * as actions_uploadDrawing from "../actions/uploadDrawing.js";
import type * as auth from "../auth.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as mutations_game from "../mutations/game.js";
import type * as mutations_games from "../mutations/games.js";
import type * as queries_cards from "../queries/cards.js";
import type * as queries_games from "../queries/games.js";
import type * as queries_guesses from "../queries/guesses.js";
import type * as queries_history from "../queries/history.js";
import type * as queries_players from "../queries/players.js";
import type * as queries_profiles from "../queries/profiles.js";
import type * as queries_turns from "../queries/turns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/generateCards": typeof actions_generateCards;
  "actions/uploadDrawing": typeof actions_uploadDrawing;
  auth: typeof auth;
  "lib/permissions": typeof lib_permissions;
  "mutations/game": typeof mutations_game;
  "mutations/games": typeof mutations_games;
  "queries/cards": typeof queries_cards;
  "queries/games": typeof queries_games;
  "queries/guesses": typeof queries_guesses;
  "queries/history": typeof queries_history;
  "queries/players": typeof queries_players;
  "queries/profiles": typeof queries_profiles;
  "queries/turns": typeof queries_turns;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
