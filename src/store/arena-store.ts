import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { getRandomIntermediateBoard } from "@/lib/board-presets";
import {
	addRandomTile,
	checkGameOver,
	type Direction,
	type Grid,
	getHighestTile,
	isValidMove,
	moveGrid,
} from "@/lib/game-logic";
import { MODELS } from "@/lib/models";

// Configuration Constants
const MAX_CONSECUTIVE_INVALID_MOVES = 10;
const GLOBAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT_MS = 90 * 1000; // 90 seconds


export type PlayerStatus = "IDLE" | "THINKING" | "PLAYING" | "WON" | "GAME_OVER" | "ERROR";

export interface HistoryEntry {
	turn: number;
	direction: Direction;
	result: "SUCCESS" | "INVALID";
	scoreAfter: number;
}

export interface PlayerState {
	modelId: string;
	grid: Grid;
	status: PlayerStatus;
	stats: {
		moves: number; // This is effectively "Turns"
		score: number;
		totalThinkingTimeMs: number;
		maxTile: number;
	};
	history: HistoryEntry[];
	consecutiveInvalidMoves: number;
	startTimeMs?: number;
	errorMessage?: string;
	errorDetails?: string;
}

interface ArenaStore {
	targetTile: number;
	players: Record<string, PlayerState>;
	isArenaRunning: boolean;

	// Actions
	startBattle: () => void;
	stopBattle: () => void;
	resetArena: () => void;

	// The Core Logic
	processMove: (modelId: string, direction: Direction, thinkingTimeMs: number) => void;
	markError: (modelId: string, message: string, details?: string) => void;
	playTurn: (modelId: string) => Promise<void>;
	saveMatchResults: () => Promise<void>;
}

const createInitialPlayers = (grid: Grid): Record<string, PlayerState> => {
	const players: Record<string, PlayerState> = {};

	MODELS.forEach((id) => {
		const playerGrid = JSON.parse(JSON.stringify(grid));

		players[id] = {
			modelId: id,
			grid: playerGrid,
			status: "IDLE",
			stats: {
				moves: 0,
				score: 0,
				totalThinkingTimeMs: 0,
				maxTile: getHighestTile(playerGrid),
			},
			history: [],
			consecutiveInvalidMoves: 0,
		};
	});
	return players;
};

export const useArenaStore = create<ArenaStore>((set, get) => ({
	targetTile: 128,
	players: createInitialPlayers(getRandomIntermediateBoard()),
	isArenaRunning: false,

	playTurn: async (modelId) => {
		const state = get();
		const player = state.players[modelId];

		// 1. Checks
		if (!state.isArenaRunning || !player || player.status !== "PLAYING") {
			return;
		}

		// 2. Check global timeout
		if (player.startTimeMs) {
			const elapsed = Date.now() - player.startTimeMs;
			if (elapsed > GLOBAL_TIMEOUT_MS) {
				state.markError(
					modelId,
					"Global timeout exceeded",
					`Player exceeded ${GLOBAL_TIMEOUT_MS / 1000}s limit (${Math.round(elapsed / 1000)}s elapsed)`,
				);
				return;
			}
		}

		try {
			// 3. API Call with timeout
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error("API timeout")), API_TIMEOUT_MS),
			);

			const apiPromise = apiClient.api["ai-move"].$post({
				json: {
					grid: player.grid,
					score: player.stats.score,
					modelId: modelId,
					history: player.history.map((h) => ({
						turn: h.turn,
						direction: h.direction,
						result: h.result,
					})),
				},
			});

			const res = await Promise.race([apiPromise, timeoutPromise]) as Awaited<
				typeof apiPromise
			>;

			if (!res.ok) {
				throw new Error(`API Error: ${res.status}`);
			}
			const data = await res.json();

			// 4. Process Move
			state.processMove(modelId, data.direction as Direction, data.durationMs);

			// 5. Recursive Call (Next Turn)
			// We fetch the fresh state to check if we should continue
			const freshState = get();
			if (freshState.isArenaRunning && freshState.players[modelId].status === "PLAYING") {
				freshState.playTurn(modelId);
			}
		} catch (error) {
			console.error(`Error for ${modelId}:`, error);
			const errorMsg = error instanceof Error ? error.message : "Unknown error";
			if (errorMsg.includes("timeout") || errorMsg.includes("aborted")) {
				state.markError(
					modelId,
					"API timeout",
					`Move request exceeded ${API_TIMEOUT_MS / 1000}s limit`,
				);
			} else {
				state.markError(modelId, "API error", errorMsg);
			}
		}
	},

	startBattle: () => {
		const now = Date.now();
		set((state) => {
			const newPlayers = { ...state.players };
			Object.keys(newPlayers).forEach((key) => {
				newPlayers[key].status = "PLAYING";
				newPlayers[key].startTimeMs = now;
				newPlayers[key].consecutiveInvalidMoves = 0;
			});
			return { isArenaRunning: true, players: newPlayers };
		});

		// Trigger the loop for everyone
		const state = get();
		Object.keys(state.players).forEach((modelId) => {
			state.playTurn(modelId);
		});
	},

	stopBattle: () => {
		set({ isArenaRunning: false });
	},

	resetArena: () => {
		set({ players: createInitialPlayers(getRandomIntermediateBoard()), isArenaRunning: false });
	},

	processMove: (modelId, direction, thinkingTimeMs) => {
		set((state) => {
			const player = state.players[modelId];
			if (!player || player.status !== "PLAYING") {
				return state;
			}

			// 1. Validate Client Side
			const valid = isValidMove(player.grid, direction);
			const currentTurn = player.stats.moves + 1;

			let newGrid = player.grid;
			let scoreIncrease = 0;
			let moveResult: "SUCCESS" | "INVALID" = "INVALID";

			if (valid) {
				// Apply Move
				const result = moveGrid(player.grid, direction);
				newGrid = addRandomTile(result.newGrid);
				scoreIncrease = result.scoreIncrease;
				moveResult = "SUCCESS";
			}

			// 2. Update Stats
			const newScore = player.stats.score + scoreIncrease;
			const newTotalTime = player.stats.totalThinkingTimeMs + thinkingTimeMs;
			const currentMaxTile = getHighestTile(newGrid);

			// 3. Update consecutive invalid counter
			let newConsecutiveInvalid = valid ? 0 : player.consecutiveInvalidMoves + 1;

			// 4. Determine Status
			let newStatus: PlayerStatus = "PLAYING";
			if (newConsecutiveInvalid >= MAX_CONSECUTIVE_INVALID_MOVES) {
				newStatus = "ERROR";
			} else if (currentMaxTile >= state.targetTile) {
				newStatus = "WON";
			} else if (checkGameOver(newGrid)) {
				newStatus = "GAME_OVER";
			}

			// 5. Update History
			const newHistory = [
				...player.history,
				{
					turn: currentTurn,
					direction: direction,
					result: moveResult,
					scoreAfter: newScore,
				},
			];

			return {
				players: {
					...state.players,
					[modelId]: {
						...player,
						grid: newGrid,
						status: newStatus,
						stats: {
							moves: currentTurn, // Always increment turn, even if invalid
							score: newScore,
							totalThinkingTimeMs: newTotalTime,
							maxTile: currentMaxTile,
						},
						history: newHistory,
						consecutiveInvalidMoves: newConsecutiveInvalid,
						errorMessage:
							newStatus === "ERROR" && newConsecutiveInvalid >= MAX_CONSECUTIVE_INVALID_MOVES
								? "Too many invalid moves"
								: player.errorMessage,
						errorDetails:
							newStatus === "ERROR" && newConsecutiveInvalid >= MAX_CONSECUTIVE_INVALID_MOVES
								? `Player made ${newConsecutiveInvalid} consecutive invalid moves (max: ${MAX_CONSECUTIVE_INVALID_MOVES})`
								: player.errorDetails,
					},
				},
			};
		});
	},

	markError: (modelId, message, details?: string) => {
		set((state) => ({
			players: {
				...state.players,
				[modelId]: {
					...state.players[modelId],
					status: "ERROR",
					errorMessage: message,
					errorDetails: details,
				},
			},
		}));
	},

	saveMatchResults: async () => {
		const state = get();
		// Avoid double saving
		if (state.isArenaRunning) {
			return;
		}

		const results = Object.values(state.players).map((p: PlayerState) => ({
			modelId: p.modelId,
			status: p.status,
			finalScore: p.stats.score,
			maxTile: p.stats.maxTile,
			movesCount: p.stats.moves,
			totalThinkingTimeMs: p.stats.totalThinkingTimeMs,
		}));

		// Determine winner (highest score)
		const winner = results.sort((a, b) => b.finalScore - a.finalScore)[0];

		try {
			await apiClient.api.matches.$post({
				json: {
					targetTile: state.targetTile,
					winnerModelId: winner?.modelId,
					results,
				},
			});
			console.log("✅ Match results saved!");
		} catch (error) {
			console.error("❌ Failed to save match results:", error);
		}
	},
}));
