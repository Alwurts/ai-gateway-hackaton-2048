export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type Grid = number[][];

export const GRID_SIZE = 4;

export function createEmptyGrid(): Grid {
	return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

export function addRandomTile(grid: Grid): Grid {
	const emptyCells = [];
	for (let r = 0; r < GRID_SIZE; r++) {
		for (let c = 0; c < GRID_SIZE; c++) {
			if (grid[r][c] === 0) {
				emptyCells.push({ r, c });
			}
		}
	}

	if (emptyCells.length === 0) {
		return grid;
	}

	const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
	const newGrid = grid.map((row) => [...row]);
	newGrid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
	return newGrid;
}

export function createInitialGrid(): Grid {
	let grid = createEmptyGrid();
	grid = addRandomTile(grid);
	grid = addRandomTile(grid);
	return grid;
}

// Helper to simulate a move without modifying the original
export function isValidMove(grid: Grid, direction: Direction): boolean {
	const { moved } = moveGrid(grid, direction);
	return moved;
}

export function createAdvancedGrid(): Grid {
	let grid = createEmptyGrid();
	const tiles = [64, 32, 16, 8];

	for (const tile of tiles) {
		const emptyCells = [];
		for (let r = 0; r < GRID_SIZE; r++) {
			for (let c = 0; c < GRID_SIZE; c++) {
				if (grid[r][c] === 0) {
					emptyCells.push({ r, c });
				}
			}
		}
		if (emptyCells.length > 0) {
			const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
			grid[randomCell.r][randomCell.c] = tile;
		}
	}

	// Add a couple of random small tiles too
	grid = addRandomTile(grid);
	grid = addRandomTile(grid);

	return grid;
}

export function checkGameOver(grid: Grid): boolean {
	// Check for empty cells
	for (let r = 0; r < GRID_SIZE; r++) {
		for (let c = 0; c < GRID_SIZE; c++) {
			if (grid[r][c] === 0) {
				return false;
			}
		}
	}

	// Check for possible merges
	for (let r = 0; r < GRID_SIZE; r++) {
		for (let c = 0; c < GRID_SIZE; c++) {
			const val = grid[r][c];
			if (r + 1 < GRID_SIZE && grid[r + 1][c] === val) {
				return false;
			}
			if (c + 1 < GRID_SIZE && grid[r][c + 1] === val) {
				return false;
			}
		}
	}

	return true;
}

export function moveGrid(
	grid: Grid,
	direction: Direction,
): { newGrid: Grid; scoreIncrease: number; moved: boolean } {
	let newGrid = grid.map((row) => [...row]);
	let scoreIncrease = 0;
	let moved = false;

	const rotate = (grid: Grid) => {
		const rotated = createEmptyGrid();
		for (let r = 0; r < GRID_SIZE; r++) {
			for (let c = 0; c < GRID_SIZE; c++) {
				rotated[c][GRID_SIZE - 1 - r] = grid[r][c];
			}
		}
		return rotated;
	};

	// Normalize to LEFT movement
	if (direction === "UP") {
		newGrid = rotate(rotate(rotate(newGrid)));
	}
	if (direction === "RIGHT") {
		newGrid = rotate(rotate(newGrid));
	}
	if (direction === "DOWN") {
		newGrid = rotate(newGrid);
	}

	// Shift and merge
	for (let r = 0; r < GRID_SIZE; r++) {
		const row = newGrid[r].filter((val) => val !== 0);
		const newRow: number[] = [];
		let skip = false;

		for (let c = 0; c < row.length; c++) {
			if (skip) {
				skip = false;
				continue;
			}
			if (c + 1 < row.length && row[c] === row[c + 1]) {
				newRow.push(row[c] * 2);
				scoreIncrease += row[c] * 2;
				skip = true;
			} else {
				newRow.push(row[c]);
			}
		}

		const paddedRow = [...newRow, ...Array(GRID_SIZE - newRow.length).fill(0)];
		if (paddedRow.join(",") !== newGrid[r].join(",")) {
			moved = true;
		}
		newGrid[r] = paddedRow;
	}

	// Rotate back
	if (direction === "UP") {
		newGrid = rotate(newGrid);
	}
	if (direction === "RIGHT") {
		newGrid = rotate(rotate(newGrid));
	}
	if (direction === "DOWN") {
		newGrid = rotate(rotate(rotate(newGrid)));
	}

	return { newGrid, scoreIncrease, moved };
}

export function getHighestTile(grid: Grid): number {
	let max = 0;
	for (let r = 0; r < GRID_SIZE; r++) {
		for (let c = 0; c < GRID_SIZE; c++) {
			if (grid[r][c] > max) {
				max = grid[r][c];
			}
		}
	}
	return max;
}
