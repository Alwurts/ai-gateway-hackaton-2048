"use client";

import { Badge } from "@/components/ui/badge";

import { useArenaStore } from "@/store/arena-store";

interface AiBoardProps {
	modelId: string;
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

export default function AiBoard({ modelId }: AiBoardProps) {
	const player = useArenaStore((state) => state.players[modelId]);

	if (!player) {
		return <div className="bg-gray-200 h-80 rounded-lg animate-pulse" />;
	}

	const { grid, stats, status, history, errorMessage } = player;

	// Get last 3 history items reversed
	const recentHistory = [...history].reverse().slice(0, 3);

	// Helper for Status Badge
	const getStatusBadge = () => {
		switch (status) {
			case "WON":
				return <Badge className="bg-green-500 hover:bg-green-600">WINNER (128!)</Badge>;
			case "GAME_OVER":
				return <Badge variant="destructive">GAME OVER</Badge>;
			case "ERROR":
				return <Badge variant="destructive">ERROR</Badge>;
			case "PLAYING":
				return <Badge className="bg-blue-500 animate-pulse">THINKING</Badge>;
			default:
				return <Badge variant="secondary">READY</Badge>;
		}
	};

	return (
		<div
			className={`flex flex-col items-center bg-[#faf8ef] p-2 rounded-lg shadow-sm border-4 ${status === "WON" ? "border-green-400" : "border-transparent"}`}
		>
			{/* Header Stats */}
			<div className="flex justify-between items-center w-full mb-2 px-1">
				<div className="flex flex-col">
					<span className="font-bold text-[#776e65] text-sm">{modelId}</span>
					<div className="flex items-center gap-2 mt-1">
						{getStatusBadge()}
						{stats.totalThinkingTimeMs > 0 && (
							<span className="text-[10px] text-gray-500 font-mono">
								{(stats.totalThinkingTimeMs / 1000).toFixed(1)}s
							</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<div className="bg-[#bbada0] rounded px-2 py-0.5 text-center min-w-[50px]">
						<span className="text-[#eee4da] text-[10px] font-bold block leading-none mb-1">
							SCORE
						</span>
						<span className="text-white font-bold text-sm">{stats.score}</span>
					</div>
					<div className="bg-[#bbada0] rounded px-2 py-0.5 text-center min-w-[50px]">
						<span className="text-[#eee4da] text-[10px] font-bold block leading-none mb-1">
							MOVES
						</span>
						<span className="text-white font-bold text-sm">{stats.moves}</span>
					</div>
				</div>
			</div>

			{/* Error Message */}
			{errorMessage && (
				<div className="w-full bg-red-100 text-red-600 text-xs p-1 mb-2 rounded">
					<div className="font-semibold">{errorMessage}</div>
					{player.errorDetails && (
						<div className="text-[10px] mt-0.5 opacity-80">
							{player.errorDetails.length > 80
								? `${player.errorDetails.slice(0, 80)}...`
								: player.errorDetails}
						</div>
					)}
				</div>
			)}

			{/* The Grid */}
			<div className="relative bg-[#bbada0] p-2 rounded-md w-full aspect-square">
				{/* Background Grid */}
				<div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
					{Array.from({ length: 16 }).map((_, i) => (
						<div
							key={`bg-${
								// biome-ignore lint/suspicious/noArrayIndexKey: Ok
								i
							}`}
							className="bg-[#cdc1b4] rounded-sm w-full h-full"
						></div>
					))}
				</div>

				{/* Active Tiles */}
				<div className="absolute top-0 left-0 p-2 w-full h-full grid grid-cols-4 grid-rows-4 gap-2 pointer-events-none">
					{grid.map((row, r) =>
						row.map((val, c) => (
							<div key={`tile-${r}-${c}-${val}`} className="relative w-full h-full">
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
			</div>

			{/* History Log */}
			{recentHistory.length > 0 && (
				<div className="w-full mt-2 bg-white/50 rounded p-2 text-xs">
					<div className="font-bold text-[#776e65] mb-1">Last Moves:</div>
					{recentHistory.map((h) => (
						<div key={h.turn} className="flex justify-between items-center">
							<span className="font-mono text-gray-500">#{h.turn}</span>
							<span className="font-bold">{h.direction}</span>
							<span className={h.result === "SUCCESS" ? "text-green-600" : "text-red-500"}>
								{h.result}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
