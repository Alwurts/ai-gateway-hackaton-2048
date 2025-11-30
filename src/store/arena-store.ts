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
	errorMessage?: string;
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
	markError: (modelId: string, message: string) => void;
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

		try {
			// 2. API Call
			const res = await apiClient.api["ai-move"].$post({
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

			if (!res.ok) {
				throw new Error("API Error");
			}
			const data = await res.json();

			// 3. Process Move
			state.processMove(modelId, data.direction as Direction, data.durationMs);

			// 4. Recursive Call (Next Turn)
			// We fetch the fresh state to check if we should continue
			const freshState = get();
			if (freshState.isArenaRunning && freshState.players[modelId].status === "PLAYING") {
				freshState.playTurn(modelId);
			}
		} catch (error) {
			console.error(`Error for ${modelId}:`, error);
			state.markError(modelId, "Failed to fetch move");
		}
	},

	startBattle: () => {
		set((state) => {
			const newPlayers = { ...state.players };
			Object.keys(newPlayers).forEach((key) => {
				newPlayers[key].status = "PLAYING";
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

			// 3. Determine Status
			let newStatus: PlayerStatus = "PLAYING";
			if (currentMaxTile >= state.targetTile) {
				newStatus = "WON";
			} else if (checkGameOver(newGrid)) {
				newStatus = "GAME_OVER";
			}

			// 4. Update History
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
					},
				},
			};
		});
	},

	markError: (modelId, message) => {
		set((state) => ({
			players: {
				...state.players,
				[modelId]: {
					...state.players[modelId],
					status: "ERROR",
					errorMessage: message,
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
