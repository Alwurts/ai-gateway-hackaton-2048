import { z } from "zod";

export const MoveSchema = z.object({
	direction: z.enum(["UP", "DOWN", "LEFT", "RIGHT"]),
	reasoning: z.string().optional().describe("A very short reason (under 10 words) for this move."),
});

export type MoveResponse = z.infer<typeof MoveSchema>;

export const AiMoveRequestSchema = z.object({
	grid: z.array(z.array(z.number())),
	score: z.number(),
	modelId: z.string(),
	history: z.array(
		z.object({
			turn: z.number(),
			direction: z.string(),
			result: z.enum(["SUCCESS", "INVALID"]),
		}),
	),
});

export type AiMoveRequest = z.infer<typeof AiMoveRequestSchema>;
