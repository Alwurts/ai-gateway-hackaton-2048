import type { Grid } from "./game-logic";

export interface BoardPreset {
	id: string;
	name: string;
	description: string;
	grid: Grid;
}

export const BOARD_PRESETS: BoardPreset[] = [
	{
		id: "intermediate-1",
		name: "Intermediate 1",
		description: "Mid-game with medium tiles",
		grid: [
			[4, 16, 8, 2],
			[8, 32, 16, 4],
			[16, 8, 4, 2],
			[2, 4, 2, 0],
		],
	},
	{
		id: "intermediate-2",
		name: "Intermediate 2",
		description: "Mid-game with medium tiles",
		grid: [
			[2, 8, 16, 4],
			[4, 16, 32, 8],
			[8, 4, 16, 2],
			[0, 2, 4, 0],
		],
	},
	{
		id: "intermediate-3",
		name: "Intermediate 3",
		description: "Mid-game with medium tiles",
		grid: [
			[16, 8, 4, 2],
			[8, 32, 16, 4],
			[4, 16, 8, 2],
			[2, 4, 2, 0],
		],
	},
	{
		id: "intermediate-4",
		name: "Intermediate 4",
		description: "Mid-game with medium tiles",
		grid: [
			[8, 4, 16, 2],
			[16, 32, 8, 4],
			[4, 8, 16, 2],
			[0, 2, 4, 0],
		],
	},
	{
		id: "intermediate-5",
		name: "Intermediate 5",
		description: "Mid-game with medium tiles",
		grid: [
			[2, 16, 4, 8],
			[4, 8, 32, 16],
			[2, 4, 8, 4],
			[0, 2, 0, 2],
		],
	},
	{
		id: "intermediate-6",
		name: "Intermediate 6",
		description: "Mid-game with medium tiles",
		grid: [
			[16, 4, 8, 2],
			[32, 16, 4, 8],
			[8, 4, 16, 2],
			[2, 0, 2, 4],
		],
	},
	{
		id: "intermediate-7",
		name: "Intermediate 7",
		description: "Mid-game with medium tiles",
		grid: [
			[4, 8, 2, 16],
			[8, 16, 4, 32],
			[2, 4, 8, 16],
			[0, 2, 4, 2],
		],
	},
	{
		id: "intermediate-8",
		name: "Intermediate 8",
		description: "Mid-game with medium tiles",
		grid: [
			[8, 16, 4, 2],
			[16, 32, 8, 4],
			[4, 8, 16, 2],
			[2, 4, 0, 0],
		],
	},
	{
		id: "intermediate-9",
		name: "Intermediate 9",
		description: "Mid-game with medium tiles",
		grid: [
			[2, 4, 8, 16],
			[4, 8, 16, 32],
			[2, 4, 8, 4],
			[0, 2, 4, 2],
		],
	},
	{
		id: "intermediate-10",
		name: "Intermediate 10",
		description: "Mid-game with medium tiles",
		grid: [
			[16, 8, 4, 2],
			[32, 16, 8, 4],
			[16, 8, 4, 2],
			[4, 2, 0, 0],
		],
	},
];

export function getPresetById(id: string): Grid | null {
	const preset = BOARD_PRESETS.find((p) => p.id === id);
	return preset ? preset.grid : null;
}

export function getRandomIntermediateBoard(): Grid {
	const randomIndex = Math.floor(Math.random() * BOARD_PRESETS.length);
	return JSON.parse(JSON.stringify(BOARD_PRESETS[randomIndex].grid));
}
