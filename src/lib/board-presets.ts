import type { Grid } from "./game-logic";

export interface BoardPreset {
	id: string;
	name: string;
	description: string;
	grid: Grid;
}

export const BOARD_PRESETS: BoardPreset[] = [
	{
		id: "empty",
		name: "Empty Board",
		description: "Start from scratch with just two tiles",
		grid: [
			[0, 0, 0, 2],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[2, 0, 0, 0],
		],
	},
	{
		id: "beginner",
		name: "Beginner",
		description: "Early game with small tiles",
		grid: [
			[2, 4, 2, 0],
			[4, 8, 4, 2],
			[2, 4, 2, 0],
			[0, 2, 0, 0],
		],
	},
	{
		id: "intermediate",
		name: "Intermediate",
		description: "Mid-game with medium tiles",
		grid: [
			[4, 16, 8, 2],
			[8, 32, 16, 4],
			[16, 8, 4, 2],
			[2, 4, 2, 0],
		],
	},
	{
		id: "advanced",
		name: "Advanced",
		description: "Late game approaching 128",
		grid: [
			[8, 32, 16, 4],
			[16, 64, 32, 8],
			[32, 16, 8, 4],
			[4, 8, 4, 2],
		],
	},
	{
		id: "near-128",
		name: "Near 128",
		description: "One or two moves away from 128 tile",
		grid: [
			[64, 32, 16, 8],
			[32, 64, 32, 16],
			[16, 32, 16, 8],
			[8, 16, 8, 4],
		],
	},
	{
		id: "almost-there",
		name: "Almost There",
		description: "Ready to create 128 on next move",
		grid: [
			[64, 64, 32, 16],
			[32, 16, 8, 4],
			[16, 8, 4, 2],
			[8, 4, 2, 0],
		],
	},
];

export function getPresetById(id: string): Grid | null {
	const preset = BOARD_PRESETS.find((p) => p.id === id);
	return preset ? preset.grid : null;
}
