import { z } from "zod";

export const MoveSchema = z.object({
	direction: z.enum(["UP", "DOWN", "LEFT", "RIGHT"]),
	//reasoning: z.string().describe("Short strategic reason for this move."),
});

export type MoveResponse = z.infer<typeof MoveSchema>;
