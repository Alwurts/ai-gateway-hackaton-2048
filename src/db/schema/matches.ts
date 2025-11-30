import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const match = pgTable("match", {
	id: uuid("id").primaryKey().defaultRandom(),
	targetTile: integer("target_tile").notNull().default(128),
	winnerModelId: text("winner_model_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matchResult = pgTable("match_result", {
	id: uuid("id").primaryKey().defaultRandom(),
	matchId: uuid("match_id")
		.references(() => match.id)
		.notNull(),
	modelId: text("model_id").notNull(),

	// Performance Stats
	status: text("status").notNull(), // 'WON', 'LOST', 'TIMEOUT', 'ERROR'
	finalScore: integer("final_score").notNull(),
	maxTile: integer("max_tile").notNull(),
	movesCount: integer("moves_count").notNull(),

	// Time is stored in milliseconds (Server-side execution time)
	totalThinkingTimeMs: integer("total_thinking_time_ms").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});
