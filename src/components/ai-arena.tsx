"use client";

import { useMemo, useState } from "react";
import { BOARD_PRESETS, getPresetById } from "@/lib/board-presets";
import { MODELS } from "@/lib/models";
import AiBoard from "./ai-board";

export default function AiArena() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [arenaKey, setArenaKey] = useState(0);
	const [selectedPreset, setSelectedPreset] = useState("advanced");

	// Generate a shared starting grid for all AIs - deep copy to ensure no shared references
	const startGrid = useMemo(() => {
		const presetGrid = getPresetById(selectedPreset);
		if (!presetGrid) {
			console.error(`Preset ${selectedPreset} not found`);
			return BOARD_PRESETS[0].grid.map((row) => [...row]);
		}
		return presetGrid.map((row) => [...row]);
	}, [selectedPreset]);

	const toggleBattle = () => {
		setIsPlaying(!isPlaying);
	};

	const resetArena = () => {
		setIsPlaying(false);
		setArenaKey((prev) => prev + 1);
	};

	return (
		<div className="flex flex-col items-center min-h-screen bg-[#faf8ef] p-8 font-sans">
			<div className="flex flex-col items-center mb-8 gap-4">
				<h1 className="text-5xl font-bold text-[#776e65]">2048 Battle Arena</h1>
				<p className="text-[#776e65] text-lg">
					{MODELS.length} Top AIs competing to reach the <strong>128 tile</strong> first!
				</p>

				{/* Board Preset Selector */}
				<div className="flex items-center gap-3">
					<label htmlFor="preset-select" className="text-[#776e65] font-semibold">
						Starting Board:
					</label>
					<select
						id="preset-select"
						value={selectedPreset}
						onChange={(e) => {
							setSelectedPreset(e.target.value);
							setIsPlaying(false);
							setArenaKey((prev) => prev + 1);
						}}
						className="px-4 py-2 rounded-md border-2 border-[#bbada0] bg-white text-[#776e65] font-semibold cursor-pointer hover:border-[#8f7a66] transition-colors"
						disabled={isPlaying}
					>
						{BOARD_PRESETS.map((preset) => (
							<option key={preset.id} value={preset.id}>
								{preset.name} - {preset.description}
							</option>
						))}
					</select>
				</div>

				<div className="flex gap-4">
					<button
						type="button"
						onClick={toggleBattle}
						className={`px-6 py-3 rounded-md font-bold text-xl transition-colors shadow-md ${
							isPlaying
								? "bg-red-500 hover:bg-red-600 text-white"
								: "bg-purple-600 hover:bg-purple-700 text-white"
						}`}
					>
						{isPlaying ? "Stop Battle" : "Start Battle"}
					</button>

					<button
						type="button"
						onClick={resetArena}
						className="px-6 py-3 rounded-md font-bold text-xl bg-[#8f7a66] hover:bg-[#9c8b7a] text-white transition-colors shadow-md"
					>
						Reset All
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
				{MODELS.map((modelId) => {
					// Create a fresh deep copy for each board to avoid shared references
					const boardGrid = startGrid.map((row) => [...row]);

					return (
						<AiBoard
							key={`${arenaKey}-${modelId}`}
							modelId={modelId}
							name={modelId}
							provider="AI Gateway"
							isPlaying={isPlaying}
							initialGrid={boardGrid}
						/>
					);
				})}
			</div>
		</div>
	);
}
