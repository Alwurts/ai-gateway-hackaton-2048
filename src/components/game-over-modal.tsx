"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { useArenaStore } from "@/store/arena-store";

interface GameOverDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function GameOverDialog({ open, onOpenChange }: GameOverDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl md:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
				<DialogHeader className="p-6 border-b border-gray-100 bg-[#faf8ef]">
					<DialogTitle className="text-3xl font-bold text-[#776e65]">Game Over!</DialogTitle>
					<p className="text-[#776e65]/80">Battle finished. Here are the results.</p>
				</DialogHeader>
				<GameOverContent onClose={() => onOpenChange(false)} />
			</DialogContent>
		</Dialog>
	);
}

function formatTime(ms: number) {
	if (ms < 1000) {
		return `${ms}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

function GameOverContent({ onClose }: { onClose: () => void }) {
	const { players, resetArena } = useArenaStore();

	const { data: leaderboard, isLoading } = useQuery({
		queryKey: ["leaderboard"],
		queryFn: async () => {
			const res = await apiClient.api.matches.leaderboard.$get();
			if (!res.ok) {
				throw new Error("Failed to fetch leaderboard");
			}
			const data = await res.json();
			return data.leaderboard;
		},
	});

	return (
		<div className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* Current Match Results */}
			<div className="flex flex-col h-full overflow-hidden">
				<h3 className="text-xl font-bold text-[#776e65] mb-4">Match Results</h3>
				<div className="flex-1 overflow-hidden rounded-lg border border-[#bbada0]/20 flex flex-col">
					<div className="overflow-y-auto">
						<table className="w-full text-sm text-left text-[#776e65]">
							<thead className="text-xs uppercase bg-[#bbada0]/10 sticky top-0 z-10 backdrop-blur-sm">
								<tr>
									<th className="px-4 py-3">Model</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3 text-right">Score</th>
									<th className="px-4 py-3 text-right">Max Tile</th>
									<th className="px-4 py-3 text-right">Moves</th>
									<th className="px-4 py-3 text-right">Time</th>
								</tr>
							</thead>
							<tbody>
								{Object.values(players)
									.sort((a, b) => b.stats.score - a.stats.score)
									.map((player) => (
										<tr
											key={player.modelId}
											className={`border-b border-[#bbada0]/10 ${
												player.status === "WON" ? "bg-green-50/50" : "bg-white"
											}`}
										>
											<td className="px-4 py-3 font-bold">{player.modelId}</td>
											<td className="px-4 py-3">
												<span
													className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
														player.status === "WON"
															? "bg-green-100 text-green-700"
															: player.status === "GAME_OVER"
																? "bg-gray-100 text-gray-600"
																: "bg-red-100 text-red-600"
													}`}
												>
													{player.status.replace("_", " ")}
												</span>
											</td>
											<td className="px-4 py-3 text-right font-mono">{player.stats.score}</td>
											<td className="px-4 py-3 text-right">
												<div className="inline-block px-2 py-0.5 bg-[#edc22e] text-white text-xs font-bold rounded">
													{player.stats.maxTile}
												</div>
											</td>
											<td className="px-4 py-3 text-right font-mono">{player.stats.moves}</td>
											<td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
												{formatTime(player.stats.totalThinkingTimeMs)}
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Global Leaderboard */}
			<div className="flex flex-col h-full overflow-hidden">
				<h3 className="text-xl font-bold text-[#776e65] mb-4">Global Leaderboard</h3>
				{isLoading ? (
					<div className="flex justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#776e65]"></div>
					</div>
				) : (
					<div className="flex-1 overflow-hidden rounded-lg border border-[#bbada0]/20 flex flex-col">
						<div className="overflow-y-auto">
							<table className="w-full text-sm text-left text-[#776e65]">
								<thead className="text-xs uppercase bg-[#bbada0]/10 sticky top-0 z-10 backdrop-blur-sm">
									<tr>
										<th className="px-4 py-3 w-12">#</th>
										<th className="px-4 py-3">Model</th>
										<th className="px-4 py-3 text-right">Games</th>
										<th className="px-4 py-3 text-right">Wins</th>
										<th className="px-4 py-3 text-right">Win Rate</th>
										<th className="px-4 py-3 text-right">Avg Score</th>
										<th className="px-4 py-3 text-right">Best Score</th>
										<th className="px-4 py-3 text-right">Avg Tile</th>
										<th className="px-4 py-3 text-right">Avg Moves</th>
									</tr>
								</thead>
								<tbody>
									{leaderboard?.map((entry, index) => (
										<tr
											key={entry.modelId}
											className="bg-white border-b border-[#bbada0]/10 hover:bg-[#faf8ef]"
										>
											<td className="px-4 py-3 font-bold text-gray-400">#{index + 1}</td>
											<td className="px-4 py-3 font-medium">{entry.modelId}</td>
											<td className="px-4 py-3 text-right font-mono">{entry.gamesPlayed}</td>
											<td className="px-4 py-3 text-right font-mono">{entry.wins}</td>
											<td className="px-4 py-3 text-right">
												<span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">
													{entry.winRate.toFixed(1)}%
												</span>
											</td>
											<td className="px-4 py-3 text-right font-mono">{entry.avgScore}</td>
											<td className="px-4 py-3 text-right font-mono font-bold">
												{entry.bestScore}
											</td>
											<td className="px-4 py-3 text-right">
												<div className="inline-block px-2 py-0.5 bg-[#edc22e] text-white text-xs font-bold rounded">
													{entry.avgMaxTile}
												</div>
											</td>
											<td className="px-4 py-3 text-right font-mono">{entry.avgMoves}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={() => {
							onClose();
							resetArena();
						}}
						className="px-6 py-2 bg-[#8f7a66] hover:bg-[#9c8b7a] text-white font-bold rounded-md transition-colors shadow-sm"
					>
						Play Again
					</button>
				</div>
			</div>
		</div>
	);
}
