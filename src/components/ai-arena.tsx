"use client";

import { useState } from "react";
import { BOARD_PRESETS } from "@/lib/board-presets";
import { MODELS } from "@/lib/models";
import { useArenaStore } from "@/store/arena-store";
import AiBoard from "./ai-board";

export default function AiArena() {
	const [selectedPreset, setSelectedPreset] = useState("advanced");

	// Selectors from Store
	const { setPreset, startBattle, stopBattle, resetArena, isArenaRunning } = useArenaStore();

	const handleToggleBattle = () => {
		if (isArenaRunning) {
			console.log("🛑 Stopping battle");
			stopBattle();
		} else {
			console.log("▶️ Starting battle");
			startBattle();
		}
	};

	return (
		<div className="flex flex-col items-center min-h-screen bg-[#faf8ef] p-8 font-sans">
			<div className="flex flex-col items-center mb-8 gap-4">
				<h1 className="text-5xl font-bold text-[#776e65]">2048 Battle Arena</h1>
				<p className="text-[#776e65] text-lg">
					{MODELS.length} Top AIs competing to reach the <strong>128 tile</strong> first!
				</p>

				{/* Controls */}
				<div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
					<div className="flex items-center gap-3">
						<label htmlFor="preset-select" className="text-[#776e65] font-semibold">
							Starting Board:
						</label>
						<select
							id="preset-select"
							value={selectedPreset}
							onChange={(e) => {
								const newPreset = e.target.value;
								console.log(`🔄 Changing preset to: ${newPreset}`);
								setSelectedPreset(newPreset);
								stopBattle();
								setPreset(newPreset);
							}}
							className="px-4 py-2 rounded-md border-2 border-[#bbada0] bg-white text-[#776e65] font-semibold cursor-pointer"
							disabled={isArenaRunning}
						>
							{BOARD_PRESETS.map((preset) => (
								<option key={preset.id} value={preset.id}>
									{preset.name} - {preset.description}
								</option>
							))}
						</select>
					</div>

					<div className="h-8 w-[2px] bg-gray-200 hidden md:block"></div>

					<div className="flex gap-4">
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
							onClick={() => resetArena(selectedPreset)}
							className="px-6 py-2 rounded-md font-bold text-lg bg-[#8f7a66] hover:bg-[#9c8b7a] text-white transition-colors shadow-md"
						>
							Reset
						</button>
					</div>
				</div>
			</div>

			{/* The Grid of Players */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
				{MODELS.map((modelId) => (
					<AiBoard key={modelId} modelId={modelId} />
				))}
			</div>
		</div>
	);
}
