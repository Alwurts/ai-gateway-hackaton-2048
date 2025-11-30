import { z } from "zod";

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
