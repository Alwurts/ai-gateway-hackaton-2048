import { useCallback, useRef, useState } from "react";
import {
	addRandomTile,
	checkGameOver,
	createInitialGrid,
	type Direction,
	type Grid,
	moveGrid,
} from "@/lib/game-logic";

export type { Grid, Direction };

export interface MoveHistoryEntry {
	turn: number;
	direction: Direction;
	gridBefore: Grid;
	gridAfter: Grid;
	scoreIncrease: number;
	scoreBefore: number;
	scoreAfter: number;
}

interface GameState {
	grid: Grid;
	score: number;
	turns: number;
	gameOver: boolean;
	won: boolean;
	moveHistory: MoveHistoryEntry[];
}

export default function use2048(initialGrid?: Grid) {
	// 1. The Source of Truth (Ref) - Synchronous access
	const stateRef = useRef<GameState>({
		grid: initialGrid ? initialGrid.map((row) => [...row]) : createInitialGrid(),
		score: 0,
		turns: 0,
		gameOver: false,
		won: false,
		moveHistory: [],
	});

	// 2. The View State (React State) - For rendering
	const [_, setTick] = useState(0); // Force render

	const startNewGame = useCallback(() => {
		const newGrid = createInitialGrid();

		const newState = {
			grid: newGrid,
			score: 0,
			turns: 0,
			gameOver: false,
			won: false,
			moveHistory: [],
		};

		stateRef.current = newState;
		setTick((t) => t + 1);
	}, []);

	const move = useCallback((direction: Direction) => {
		const currentState = stateRef.current;
		if (currentState.gameOver) {
			return currentState;
		}

		const { newGrid, scoreIncrease, moved } = moveGrid(currentState.grid, direction);

		if (moved) {
			let nextGrid = newGrid;
			const nextScore = currentState.score + scoreIncrease;
			const nextTurns = currentState.turns + 1;

			// Add random tile
			nextGrid = addRandomTile(nextGrid);

			// Check game over
			const isGameOver = checkGameOver(nextGrid);

			// Create history entry
			const historyEntry: MoveHistoryEntry = {
				turn: nextTurns,
				direction,
				gridBefore: currentState.grid,
				gridAfter: nextGrid,
				scoreIncrease,
				scoreBefore: currentState.score,
				scoreAfter: nextScore,
			};

			const newState = {
				grid: nextGrid,
				score: nextScore,
				turns: nextTurns,
				gameOver: isGameOver,
				won: false,
				moveHistory: [...currentState.moveHistory, historyEntry],
			};

			stateRef.current = newState;
			setTick((t) => t + 1);

			return newState;
		}

		return currentState;
	}, []);

	// Expose a getter for the absolute latest state (for AI)
	const getGameState = useCallback(() => stateRef.current, []);

	return {
		grid: stateRef.current.grid,
		score: stateRef.current.score,
		turns: stateRef.current.turns,
		gameOver: stateRef.current.gameOver,
		won: stateRef.current.won,
		moveHistory: stateRef.current.moveHistory,
		startNewGame,
		move,
		getGameState,
	};
}
