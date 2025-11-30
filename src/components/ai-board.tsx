"use client";

import use2048, { type Grid } from "../hooks/use-2048";
import { useAiPlayer } from "../hooks/use-ai-player";

interface AiBoardProps {
	modelId: string;
	name: string;
	provider: string;
	isPlaying: boolean;
	initialGrid?: Grid;
}

const TILE_COLORS: Record<number, string> = {
	0: "bg-[#cdc1b4]",
	2: "bg-[#eee4da] text-[#776e65]",
	4: "bg-[#ede0c8] text-[#776e65]",
	8: "bg-[#f2b179] text-[#f9f6f2]",
	16: "bg-[#f59563] text-[#f9f6f2]",
	32: "bg-[#f67c5f] text-[#f9f6f2]",
	64: "bg-[#f65e3b] text-[#f9f6f2]",
	128: "bg-[#edcf72] text-[#f9f6f2]",
	256: "bg-[#edcc61] text-[#f9f6f2]",
	512: "bg-[#edc850] text-[#f9f6f2]",
	1024: "bg-[#edc53f] text-[#f9f6f2]",
	2048: "bg-[#edc22e] text-[#f9f6f2]",
};

const TILE_FONT_SIZES: Record<number, string> = {
	2: "text-2xl",
	4: "text-2xl",
	8: "text-2xl",
	16: "text-2xl",
	32: "text-2xl",
	64: "text-2xl",
	128: "text-xl",
	256: "text-xl",
	512: "text-xl",
	1024: "text-lg",
	2048: "text-lg",
};

export default function AiBoard({ modelId, name, provider, isPlaying, initialGrid }: AiBoardProps) {
	const { grid, score, turns, gameOver, move, getGameState } = use2048(initialGrid);
	const { isThinking } = useAiPlayer({
		getGameState,
		move,
		enabled: isPlaying && !gameOver,
		modelId,
	});

	return (
		<div className="flex flex-col items-center bg-[#faf8ef] p-2 rounded-lg shadow-sm">
			<div className="flex justify-between items-center w-full mb-2 px-1">
				<div className="flex flex-col">
					<span className="font-bold text-[#776e65] text-sm">{name}</span>
					<span className="text-[#776e65] text-[10px] opacity-75">{provider}</span>
				</div>
				<div className="flex gap-2">
					<div className="bg-[#bbada0] rounded px-2 py-0.5">
						<span className="text-[#eee4da] text-xs font-bold mr-1">SCORE</span>
						<span className="text-white font-bold text-sm">{score}</span>
					</div>
					<div className="bg-[#bbada0] rounded px-2 py-0.5">
						<span className="text-[#eee4da] text-xs font-bold mr-1">TURNS</span>
						<span className="text-white font-bold text-sm">{turns}</span>
					</div>
				</div>
			</div>

			<div className="relative bg-[#bbada0] p-2 rounded-md w-full aspect-square">
				{/* Grid Background */}
				<div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
					{Array.from({ length: 16 }).map((_, i) => (
						<div
							key={`empty-tile-${
								// biome-ignore lint/suspicious/noArrayIndexKey: Ok
								i
							}`}
							className="bg-[#cdc1b4] rounded-sm w-full h-full"
						></div>
					))}
				</div>

				{/* Tiles */}
				<div className="absolute top-0 left-0 p-2 w-full h-full grid grid-cols-4 grid-rows-4 gap-2 pointer-events-none">
					{grid.map((row, r) =>
						row.map((val, c) => (
							<div key={`row-${r}-col-${c}-${val}`} className="relative w-full h-full">
								{val !== 0 && (
									<div
										className={`absolute inset-0 flex items-center justify-center rounded-sm font-bold transition-all duration-100 ease-in-out ${TILE_COLORS[val] || "bg-[#3c3a32] text-[#f9f6f2]"} ${TILE_FONT_SIZES[val] || "text-xl"}`}
									>
										{val}
									</div>
								)}
							</div>
						)),
					)}
				</div>

				{/* Overlays */}
				{gameOver && (
					<div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-md z-10">
						<span className="text-[#776e65] font-bold text-xl">Game Over</span>
					</div>
				)}
				{isThinking && !gameOver && (
					<div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse z-20"></div>
				)}
			</div>
		</div>
	);
}
