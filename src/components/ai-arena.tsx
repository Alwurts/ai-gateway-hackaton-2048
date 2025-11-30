"use client";

import { useEffect, useState } from "react";
import { MODELS } from "@/lib/models";
import { useArenaStore } from "@/store/arena-store";
import AiBoard from "./ai-board";
import GameOverModal from "./game-over-modal";

export default function AiArena() {
	const [showGameOver, setShowGameOver] = useState(false);

	const { players, startBattle, stopBattle, resetArena, isArenaRunning, saveMatchResults } =
		useArenaStore();

	const handleToggleBattle = () => {
		if (isArenaRunning) {
			stopBattle();
		} else {
			startBattle();
			setShowGameOver(false);
		}
	};

	useEffect(() => {
		if (!isArenaRunning) {
			return;
		}

		const allFinished = Object.values(players).every(
			(p) => p.status === "WON" || p.status === "GAME_OVER" || p.status === "ERROR",
		);

		if (allFinished && Object.keys(players).length > 0) {
			stopBattle();
			saveMatchResults();
			setShowGameOver(true);
		}
	}, [players, isArenaRunning, stopBattle, saveMatchResults]);

	return (
		<div className="flex flex-col items-center min-h-screen bg-[#faf8ef] p-8 font-sans">
			<div className="flex flex-col items-center mb-8 gap-4">
				<h1 className="text-5xl font-bold text-[#776e65]">2048 Battle Arena</h1>
				<p className="text-[#776e65] text-lg">
					{MODELS.length} AIs competing to reach the <strong>128 tile</strong> first!
				</p>

				<div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
					<button
						type="button"
						onClick={handleToggleBattle}
						className={`px-6 py-2 rounded-md font-bold text-lg transition-colors shadow-md ${
							isArenaRunning
								? "bg-red-500 hover:bg-red-600 text-white"
								: "bg-purple-600 hover:bg-purple-700 text-white"
						}`}
					>
						{isArenaRunning ? "Stop Battle" : "Start Battle"}
					</button>

					<button
						type="button"
						onClick={() => resetArena()}
						className="px-6 py-2 rounded-md font-bold text-lg bg-[#8f7a66] hover:bg-[#9c8b7a] text-white transition-colors shadow-md"
					>
						Reset
					</button>

					<div className="h-8 w-[2px] bg-gray-200"></div>

					<button
						type="button"
						onClick={() => setShowGameOver(true)}
						className="px-6 py-2 rounded-md font-bold text-lg bg-[#edc22e] hover:bg-[#ddb21e] text-white transition-colors shadow-md"
					>
						View Leaderboard
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
				{MODELS.map((modelId) => (
					<AiBoard key={modelId} modelId={modelId} />
				))}
			</div>
			<GameOverModal open={showGameOver} onOpenChange={setShowGameOver} />
		</div>
	);
}
