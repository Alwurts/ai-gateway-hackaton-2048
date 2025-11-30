import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { Direction } from "@/lib/game-logic";
import { useArenaStore } from "@/store/arena-store";

export function useArenaLoop(modelId: string) {
	const { players, processMove, markError, isArenaRunning } = useArenaStore();
	const player = players[modelId];

	const isProcessingRef = useRef(false);

	// The Effect runs whenever:
	// 1. The Global "isArenaRunning" flag is true
	// 2. The Player status is "PLAYING"
	// 3. The Player "moves" count changes (meaning a turn finished, time for next)
	useEffect(() => {
		// 1. Safety Checks
		if (!player || !isArenaRunning || player.status !== "PLAYING") {
			return;
		}

		// 2. Prevent Double Execution
		if (isProcessingRef.current) {
			return;
		}

		const executeTurn = async () => {
			isProcessingRef.current = true;

			try {
				const res = await apiClient.api["ai-move"].$post({
					json: {
						grid: player.grid,
						score: player.stats.score,
						modelId: modelId,
						// Send simplified history to save tokens
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

				// CRITICAL FIX: Release the lock BEFORE updating state.
				// ProcessMove triggers a store update -> React Render -> Effect runs again.
				// If we don't unlock here, the next Effect run sees "true" and aborts the loop.
				isProcessingRef.current = false;

				// 3. Update State (Trigger next turn)
				processMove(modelId, data.direction as Direction, data.durationMs);
			} catch (error) {
				console.error(`Error for ${modelId}:`, error);
				// Unlock on error so we can try again or show error state
				isProcessingRef.current = false;
				markError(modelId, "Failed to fetch move");
			}
		};

		executeTurn();
	}, [
		isArenaRunning,
		// We rely on 'moves' explicitly to trigger the next turn
		player?.stats.moves,
		player?.status,
		modelId,
		processMove,
		markError,
        // We include player to satisfy linter, but 'moves' is the real driver
        player
	]);
}
