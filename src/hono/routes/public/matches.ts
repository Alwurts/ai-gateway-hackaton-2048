import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { match, matchResult } from "@/db/schema";

const app = new Hono()
	.post(
		"/",
		zValidator(
			"json",
			z.object({
				targetTile: z.number(),
				winnerModelId: z.string().optional(),
				results: z.array(
					z.object({
						modelId: z.string(),
						status: z.string(),
						finalScore: z.number(),
						maxTile: z.number(),
						movesCount: z.number(),
						totalThinkingTimeMs: z.number(),
					}),
				),
			}),
		),
		async (c) => {
			const { targetTile, winnerModelId, results } = c.req.valid("json");

			// 1. Create Match
			const [newMatch] = await db
				.insert(match)
				.values({
					targetTile,
					winnerModelId,
				})
				.returning();

			// 2. Create Match Results
			if (results.length > 0) {
				await db.insert(matchResult).values(
					results.map((r) => ({
						matchId: newMatch.id,
						modelId: r.modelId,
						status: r.status,
						finalScore: r.finalScore,
						maxTile: r.maxTile,
						movesCount: r.movesCount,
						totalThinkingTimeMs: r.totalThinkingTimeMs,
					})),
				);
			}

			return c.json({ success: true, matchId: newMatch.id });
		},
	)
	.get("/leaderboard", async (c) => {
		// Get all match results
		const allResults = await db.select().from(matchResult);

		// Group by modelId and calculate aggregated stats
		const aggregatedMap = new Map<
			string,
			{
				modelId: string;
				totalGames: number;
				wins: number;
				totalScore: number;
				bestScore: number;
				totalMaxTile: number;
				totalMoves: number;
			}
		>();

		for (const result of allResults) {
			const existing = aggregatedMap.get(result.modelId);
			const isWin = result.status === "WON" ? 1 : 0;

			if (existing) {
				existing.totalGames += 1;
				existing.wins += isWin;
				existing.totalScore += result.finalScore;
				existing.bestScore = Math.max(existing.bestScore, result.finalScore);
				existing.totalMaxTile += result.maxTile;
				existing.totalMoves += result.movesCount;
			} else {
				aggregatedMap.set(result.modelId, {
					modelId: result.modelId,
					totalGames: 1,
					wins: isWin,
					totalScore: result.finalScore,
					bestScore: result.finalScore,
					totalMaxTile: result.maxTile,
					totalMoves: result.movesCount,
				});
			}
		}

		// Convert to array and calculate averages
		const leaderboard = Array.from(aggregatedMap.values()).map((stats) => ({
			modelId: stats.modelId,
			gamesPlayed: stats.totalGames,
			wins: stats.wins,
			winRate: (stats.wins / stats.totalGames) * 100,
			avgScore: Math.round(stats.totalScore / stats.totalGames),
			bestScore: stats.bestScore,
			avgMaxTile: Math.round(stats.totalMaxTile / stats.totalGames),
			avgMoves: Math.round(stats.totalMoves / stats.totalGames),
		}));

		// Sort by win rate (desc), then by average score (desc)
		leaderboard.sort((a, b) => {
			if (b.winRate !== a.winRate) {
				return b.winRate - a.winRate;
			}
			return b.avgScore - a.avgScore;
		});

		return c.json({ leaderboard });
	});

export default app;
