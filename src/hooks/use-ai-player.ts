import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { Direction, Grid } from "@/lib/game-logic";
import type { MoveResponse } from "@/lib/schema";
import type { MoveHistoryEntry } from "./use-2048";

interface GameState {
	grid: Grid;
	score: number;
	turns: number;
	gameOver: boolean;
	moveHistory: MoveHistoryEntry[];
}

interface UseAiPlayerProps {
	getGameState: () => GameState;
	move: (dir: Direction) => GameState;
	enabled?: boolean;
	modelId: string;
}

export function useAiPlayer({ getGameState, move, enabled = false, modelId }: UseAiPlayerProps) {
	const [isAiPlaying, setIsAiPlaying] = useState(false);
	const isPlayingRef = useRef(false);

	// The API Mutation
	const { mutateAsync: fetchMove, isPending } = useMutation({
		mutationFn: async ({
			grid,
			score,
			turns,
			invalidMove,
			moveHistory,
		}: {
			grid: Grid;
			score: number;
			turns: number;
			invalidMove?: string;
			moveHistory: MoveHistoryEntry[];
		}) => {
			const res = await apiClient.api["ai-move"].$post({
				json: { grid, score, turns, modelId, invalidMove, moveHistory },
			});

			if (!res.ok) {
				throw new Error(`API request failed: ${res.status}`);
			}

			return (await res.json()) as MoveResponse;
		},
	});

	// The Game Loop
	const runAiLoop = useCallback(async () => {
		if (isPlayingRef.current) {
			return; // Already running
		}

		isPlayingRef.current = true;
		setIsAiPlaying(true);

		console.log(`[AI LOOP START] Model: ${modelId}`);

		const MAX_RETRIES = 5;

		while (isPlayingRef.current) {
			try {
				// 1. Get FRESH state synchronously
				const currentState = getGameState();

				if (currentState.gameOver) {
					console.log(
						`[AI LOOP END] Model: ${modelId} - Game Over | Final Score: ${currentState.score} | Turns: ${currentState.turns}`,
					);
					setIsAiPlaying(false);
					isPlayingRef.current = false;
					break;
				}

				let direction: string | null = null;
				let retryCount = 0;
				let lastInvalidMove: string | undefined;

				// Retry loop for invalid moves
				while (retryCount < MAX_RETRIES && !direction) {
					// 2. Get Move from AI
					const response = await fetchMove({
						grid: currentState.grid,
						score: currentState.score,
						turns: currentState.turns,
						invalidMove: lastInvalidMove,
						moveHistory: currentState.moveHistory,
					});

					// 3. Check stop condition
					if (!isPlayingRef.current) {
						console.log(`[AI LOOP STOPPED] Model: ${modelId} - User stopped`);
						return;
					}

					// 4. Try to execute the move
					const newState = move(response.direction);

					// Check if the move was valid (board changed)
					if (newState.turns > currentState.turns) {
						// Valid move!
						direction = response.direction;
						console.log(
							`[AI MOVE SUCCESS] Model: ${modelId} | Direction: ${direction} | Turn: ${newState.turns}`,
						);
					} else {
						// Invalid move - board didn't change
						retryCount++;
						lastInvalidMove = response.direction;
						console.warn(
							`[AI INVALID MOVE] Model: ${modelId} | Direction: ${response.direction} | Retry: ${retryCount}/${MAX_RETRIES}`,
						);
					}
				}

				if (!direction) {
					// Failed after max retries
					console.error(
						`[AI FAILED] Model: ${modelId} - Could not find valid move after ${MAX_RETRIES} attempts`,
					);
					setIsAiPlaying(false);
					isPlayingRef.current = false;
					break;
				}
			} catch (error) {
				console.error(`[AI LOOP ERROR] Model: ${modelId}`, error);
				setIsAiPlaying(false);
				isPlayingRef.current = false;
				break;
			}
		}
	}, [fetchMove, move, getGameState, modelId]);

	const stopAi = useCallback(() => {
		isPlayingRef.current = false;
		setIsAiPlaying(false);
	}, []);

	// React to enabled prop change
	useEffect(() => {
		if (enabled) {
			runAiLoop();
		} else {
			stopAi();
		}
	}, [enabled, runAiLoop, stopAi]);

	return {
		isAiPlaying,
		isThinking: isPending,
	};
}
