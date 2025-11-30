import { create } from "zustand";
import { getPresetById } from "@/lib/board-presets";
import {
	addRandomTile,
	checkGameOver,
	createInitialGrid,
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
	setPreset: (presetId: string) => void;
	startBattle: () => void;
	stopBattle: () => void;
	resetArena: (presetId: string) => void;

	// The Core Logic
	processMove: (modelId: string, direction: Direction, thinkingTimeMs: number) => void;
	markError: (modelId: string, message: string) => void;
}

const createInitialPlayers = (presetId: string): Record<string, PlayerState> => {
	const players: Record<string, PlayerState> = {};

	MODELS.forEach((id) => {
		const presetGrid = getPresetById(presetId);
		const grid = presetGrid ? JSON.parse(JSON.stringify(presetGrid)) : createInitialGrid();

		players[id] = {
			modelId: id,
			grid,
			status: "IDLE",
			stats: {
				moves: 0,
				score: 0,
				totalThinkingTimeMs: 0,
				maxTile: getHighestTile(grid),
			},
			history: [],
		};
	});
	return players;
};

export const useArenaStore = create<ArenaStore>((set) => ({
	targetTile: 128,
	players: createInitialPlayers("advanced"),
	isArenaRunning: false,

	setPreset: (presetId) => {
		set({ players: createInitialPlayers(presetId), isArenaRunning: false });
	},

	startBattle: () => {
		set((state) => {
			const newPlayers = { ...state.players };
			Object.keys(newPlayers).forEach((key) => {
				newPlayers[key].status = "PLAYING";
			});
			return { isArenaRunning: true, players: newPlayers };
		});
	},

	stopBattle: () => {
		set({ isArenaRunning: false });
	},

	resetArena: (presetId) => {
		set({ players: createInitialPlayers(presetId), isArenaRunning: false });
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
}));
