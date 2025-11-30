import { generateObject } from "ai";
import { Hono } from "hono";
import type { MoveHistoryEntry } from "@/hooks/use-2048";
import { model } from "@/lib/models";
import { MoveSchema } from "@/lib/schema";
import type { HonoContext } from "@/types/hono";

function formatGrid(grid: number[][]): string {
	const maxWidth = Math.max(...grid.flat().map((n) => (n === 0 ? 1 : String(n).length)));

	return grid
		.map((row) =>
			row.map((cell) => (cell === 0 ? "." : String(cell)).padStart(maxWidth, " ")).join(" | "),
		)
		.join("\n");
}

function formatMoveHistory(history: MoveHistoryEntry[]): string {
	if (history.length === 0) {
		return "No previous moves.";
	}

	// Show last 5 moves to keep context manageable
	const recentHistory = history.slice(-5);

	return recentHistory
		.map((entry) => {
			return `Turn ${entry.turn}: Moved ${entry.direction}
  Score: ${entry.scoreBefore} → ${entry.scoreAfter} (+${entry.scoreIncrease})
  Board After:
${formatGrid(entry.gridAfter)
	.split("\n")
	.map((line) => `  ${line}`)
	.join("\n")}`;
		})
		.join("\n\n");
}

const aiMoveRoutes = new Hono<HonoContext>().post("/", async (c) => {
	const startTime = Date.now();
	const { grid, score, modelId, turns, invalidMove, moveHistory = [] } = await c.req.json();

	console.log(`\n[${"=".repeat(60)}]`);
	console.log(`[AI REQUEST] Model: ${modelId} | Turn: ${turns || "?"} | Score: ${score}`);
	if (invalidMove) {
		console.log(`[RETRY] Previous invalid move: ${invalidMove}`);
	}
	console.log(`[TIMESTAMP] ${new Date().toISOString()}`);

	const languageModel = model.languageModel(modelId);

	let prompt = `Current Score: ${score}

Current Grid State (0 shown as .):
${formatGrid(grid)}

Move History (last 5 moves):
${formatMoveHistory(moveHistory)}`;

	if (invalidMove) {
		prompt += `\n\nIMPORTANT: Your previous move "${invalidMove}" was INVALID (the board did not change).

This means there are no tiles that can move or merge in that direction.

You MUST choose a different direction. Valid directions are: UP, DOWN, LEFT, RIGHT.`;
	}

	console.log(`[PROMPT]\n${prompt}`);

	try {
		const { object } = await generateObject({
			model: languageModel,
			schema: MoveSchema,
			system:
				"You are an expert 2048 bot. Your goal is to reach the 128 tile. Choose the best moves to reach this value. Learn from your move history to make better decisions.",
			prompt,
		});

		const duration = Date.now() - startTime;
		console.log(
			`[AI RESPONSE] Model: ${modelId} | Direction: ${object.direction} | Duration: ${duration}ms`,
		);
		console.log(`[${"=".repeat(60)}]\n`);

		return c.json(object);
	} catch (error) {
		const duration = Date.now() - startTime;
		console.error(`[AI ERROR] Model: ${modelId} | Duration: ${duration}ms`);
		console.error(`[ERROR DETAILS]`, error);
		console.log(`[${"=".repeat(60)}]\n`);
		throw error; // Let the client handle the error
	}
});

export default aiMoveRoutes;
