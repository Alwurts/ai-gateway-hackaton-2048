import { generateObject } from "ai";
import { Hono } from "hono";
import { model, type modelID } from "@/lib/models";
import { AiMoveRequestSchema } from "@/lib/schema";

function formatGrid(grid: number[][]): string {
	const maxWidth = Math.max(...grid.flat().map((n) => (n === 0 ? 1 : String(n).length)));
	return grid
		.map((row) =>
			row.map((cell) => (cell === 0 ? "." : String(cell)).padStart(maxWidth, " ")).join(" | "),
		)
		.join("\n");
}

function formatHistory(history: { turn: number; direction: string; result: string }[]) {
	if (history.length === 0) {
		return "None";
	}
	// Get last 5 moves
	return history
		.slice(-5)
		.map((h) => `Turn ${h.turn}: ${h.direction} -> ${h.result}`)
		.join("\n");
}

const aiMoveRoutes = new Hono().post("/", async (c) => {
	const body = await c.req.json();
	const result = AiMoveRequestSchema.safeParse(body);

	if (!result.success) {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const { grid, score, modelId, history } = result.data;
	const languageModel = model.languageModel(modelId as modelID);

	const startTime = performance.now();

	// Construct Prompt
	const prompt = `
Current Game State:
- Score: ${score}
- Turn: ${history.length + 1}

Grid (0 is empty):
${formatGrid(grid)}

Recent Move History:
${formatHistory(history)}

INSTRUCTIONS:
1. Analyze the grid.
2. Review your Recent Move History.
3. WARNING: If you see "INVALID" in history, that means the move did NOT change the board. Do NOT repeat invalid moves for the same board state.
4. Select the best move (UP, DOWN, LEFT, RIGHT).
`;

	try {
		const { object } = await generateObject({
			model: languageModel,
			output: "enum",
			enum: ["UP", "DOWN", "LEFT", "RIGHT"],
			system: "You are a competitive 2048 AI. Reach the 128 tile as fast as possible.",
			prompt,
			maxRetries: 10,
		});

		const endTime = performance.now();

		return c.json({
			direction: object,
			durationMs: Math.round(endTime - startTime),
		});
	} catch (error) {
		console.error("AI Error:", error);
		return c.json({ error: "Failed to generate move" }, 500);
	}
});

export default aiMoveRoutes;
