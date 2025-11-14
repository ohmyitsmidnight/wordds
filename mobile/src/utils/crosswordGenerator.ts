/**
 * Crossword Puzzle Generation Algorithm
 * 
 * This algorithm takes a list of words with their definitions and generates
 * a valid crossword puzzle grid where words intersect at common letters.
 * 
 * Algorithm Overview:
 * 1. Sort words by length (longest first) for better grid utilization
 * 2. Place first word horizontally in center as anchor
 * 3. For each remaining word, find best intersection point with placed words
 * 4. Score potential placements based on intersections and grid density
 * 5. Compact the grid to remove empty rows/columns
 * 6. Assign clue numbers in reading order (left-to-right, top-to-bottom)
 */

export interface WordInput {
  word: string;
  clue: string;
}

export interface PlacedWord {
  number: number;
  word: string;
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
}

export interface PuzzleGrid {
  size: number;
  words: PlacedWord[];
  grid: (string | null)[][];
}

interface WordPlacement {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  score: number; // Higher score = better placement
}

/**
 * Main function to generate a crossword puzzle from a list of words
 */
export function generateCrossword(
  wordInputs: WordInput[],
  options: {
    maxAttempts?: number; // Maximum placement attempts per word
    minIntersections?: number; // Minimum intersections to consider placement valid
    gridPadding?: number; // Extra space around the grid
  } = {}
): PuzzleGrid | null {
  const {
    maxAttempts = 50,
    minIntersections = 1,
    gridPadding = 2,
  } = options;

  // Validate inputs
  if (!wordInputs || wordInputs.length === 0) {
    console.error('[Crossword] No words provided');
    return null;
  }

  // Normalize and validate words
  const normalizedWords = wordInputs
    .map((w) => ({
      word: w.word.toUpperCase().trim(),
      clue: w.clue.trim(),
    }))
    .filter((w) => w.word.length >= 2 && /^[A-Z]+$/.test(w.word)); // Only letters, min 2 chars

  if (normalizedWords.length === 0) {
    console.error('[Crossword] No valid words after normalization');
    return null;
  }

  // Sort words by length (longest first) for better grid utilization
  // Longer words placed first create better anchor points for shorter words
  const sortedWords = [...normalizedWords].sort(
    (a, b) => b.word.length - a.word.length
  );

  console.log(`[Crossword] Generating puzzle with ${sortedWords.length} words`);

  // Initialize grid with generous size (will compact later)
  // Start with size based on longest word * 3 to give room for growth
  const maxWordLength = sortedWords[0].word.length;
  const initialGridSize = Math.max(30, maxWordLength * 3);
  const grid: (string | null)[][] = Array(initialGridSize)
    .fill(null)
    .map(() => Array(initialGridSize).fill(null));

  // Track placed words
  const placedWords: WordPlacement[] = [];

  // Place first word horizontally in the center as anchor point
  const firstWord = sortedWords[0];
  const centerRow = Math.floor(initialGridSize / 2);
  const centerCol = Math.floor((initialGridSize - firstWord.word.length) / 2);

  placeWord(grid, firstWord, centerRow, centerCol, 'across');
  placedWords.push({
    ...firstWord,
    row: centerRow,
    col: centerCol,
    direction: 'across',
    score: 0,
  });

  console.log(`[Crossword] Placed anchor word: ${firstWord.word} at (${centerRow}, ${centerCol})`);

  // Try to place remaining words
  for (let i = 1; i < sortedWords.length; i++) {
    const currentWord = sortedWords[i];
    let bestPlacement: WordPlacement | null = null;
    let attempts = 0;

    console.log(`[Crossword] Finding placement for: ${currentWord.word}`);

    // Try to find best placement by checking intersections with all placed words
    while (attempts < maxAttempts && !bestPlacement) {
      const candidates: WordPlacement[] = [];

      // Check intersections with each already-placed word
      for (const placedWord of placedWords) {
        const intersections = findIntersections(currentWord.word, placedWord);

        for (const intersection of intersections) {
          // Calculate position based on intersection point
          const { currentWordIndex, placedWordIndex } = intersection;
          const direction = placedWord.direction === 'across' ? 'down' : 'across';

          let row: number, col: number;

          if (direction === 'across') {
            // Current word goes across, intersects with vertical placed word
            row = placedWord.row + placedWordIndex;
            col = placedWord.col - currentWordIndex;
          } else {
            // Current word goes down, intersects with horizontal placed word
            row = placedWord.row - currentWordIndex;
            col = placedWord.col + placedWordIndex;
          }

          // Validate placement
          if (canPlaceWord(grid, currentWord.word, row, col, direction)) {
            // Score this placement based on:
            // - Number of intersections with other words
            // - Grid density (prefer placements near existing words)
            // - Avoid creating invalid adjacent words
            const score = scorePlacement(
              grid,
              currentWord.word,
              row,
              col,
              direction,
              placedWords
            );

            candidates.push({
              ...currentWord,
              row,
              col,
              direction,
              score,
            });
          }
        }
      }

      // Select best candidate based on score
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        const best = candidates[0];

        // Only accept if it meets minimum intersection requirement
        if (best.score >= minIntersections) {
          bestPlacement = best;
        }
      }

      attempts++;
    }

    // Place the word if we found a valid placement
    if (bestPlacement) {
      placeWord(grid, currentWord, bestPlacement.row, bestPlacement.col, bestPlacement.direction);
      placedWords.push(bestPlacement);
      console.log(
        `[Crossword] Placed: ${currentWord.word} at (${bestPlacement.row}, ${bestPlacement.col}) ${bestPlacement.direction} with score ${bestPlacement.score}`
      );
    } else {
      console.warn(`[Crossword] Could not place: ${currentWord.word} after ${attempts} attempts`);
    }
  }

  // Check if we placed enough words
  if (placedWords.length < Math.min(3, sortedWords.length)) {
    console.error('[Crossword] Too few words placed to create valid puzzle');
    return null;
  }

  console.log(`[Crossword] Placed ${placedWords.length} of ${sortedWords.length} words`);

  // Compact the grid by removing empty rows and columns
  const compacted = compactGrid(grid, placedWords);

  // Assign clue numbers in reading order (top-to-bottom, left-to-right)
  const numberedWords = assignClueNumbers(compacted.words);

  return {
    size: compacted.size,
    words: numberedWords,
    grid: compacted.grid,
  };
}

/**
 * Find all possible intersection points between two words
 * Returns array of {currentWordIndex, placedWordIndex} pairs
 */
function findIntersections(
  currentWord: string,
  placedWord: WordPlacement
): Array<{ currentWordIndex: number; placedWordIndex: number }> {
  const intersections: Array<{ currentWordIndex: number; placedWordIndex: number }> = [];

  // Check each letter in current word against each letter in placed word
  for (let i = 0; i < currentWord.length; i++) {
    for (let j = 0; j < placedWord.word.length; j++) {
      if (currentWord[i] === placedWord.word[j]) {
        intersections.push({
          currentWordIndex: i,
          placedWordIndex: j,
        });
      }
    }
  }

  return intersections;
}

/**
 * Check if a word can be placed at the given position without conflicts
 */
function canPlaceWord(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): boolean {
  const gridSize = grid.length;

  // Check bounds
  if (direction === 'across') {
    if (row < 0 || row >= gridSize || col < 0 || col + word.length > gridSize) {
      return false;
    }
  } else {
    if (col < 0 || col >= gridSize || row < 0 || row + word.length > gridSize) {
      return false;
    }
  }

  // Check each cell of the word
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;

    // Cell must be either empty or contain the same letter
    if (grid[r][c] !== null && grid[r][c] !== word[i]) {
      return false;
    }

    // Check cells perpendicular to the word to avoid creating invalid adjacent words
    // Words cannot be directly adjacent (must have black cells between them)
    if (direction === 'across') {
      // Check above and below
      if (grid[r][c] === null) {
        // Only check if this is a new cell (not an intersection)
        if (r > 0 && grid[r - 1][c] !== null) return false; // Cell above is occupied
        if (r < gridSize - 1 && grid[r + 1][c] !== null) return false; // Cell below is occupied
      }
    } else {
      // Check left and right
      if (grid[r][c] === null) {
        if (c > 0 && grid[r][c - 1] !== null) return false; // Cell to left is occupied
        if (c < gridSize - 1 && grid[r][c + 1] !== null) return false; // Cell to right is occupied
      }
    }
  }

  // Check cells before and after the word (must be empty or out of bounds)
  if (direction === 'across') {
    // Check cell before word
    if (col > 0 && grid[row][col - 1] !== null) return false;
    // Check cell after word
    if (col + word.length < gridSize && grid[row][col + word.length] !== null) return false;
  } else {
    // Check cell before word
    if (row > 0 && grid[row - 1][col] !== null) return false;
    // Check cell after word
    if (row + word.length < gridSize && grid[row + word.length][col] !== null) return false;
  }

  return true;
}

/**
 * Place a word in the grid at the specified position
 */
function placeWord(
  grid: (string | null)[][],
  wordInput: WordInput,
  row: number,
  col: number,
  direction: 'across' | 'down'
): void {
  const word = wordInput.word;
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    grid[r][c] = word[i];
  }
}

/**
 * Score a potential word placement
 * Higher scores indicate better placements
 */
function scorePlacement(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  placedWords: WordPlacement[]
): number {
  let score = 0;

  // Count intersections (each intersection adds to score)
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;

    if (grid[r][c] === word[i]) {
      score += 10; // Bonus for each intersection
    }
  }

  // Bonus for being close to other words (grid density)
  // This creates a more compact puzzle
  const avgDistance = calculateAverageDistance(row, col, placedWords);
  if (avgDistance < 5) score += 5;
  if (avgDistance < 3) score += 5;

  // Penalty for very long words with few intersections
  // Encourages better grid utilization
  if (word.length > 6 && score < 10) {
    score -= 5;
  }

  return score;
}

/**
 * Calculate average distance from a position to all placed words
 * Used to prefer placements near existing words (compact grid)
 */
function calculateAverageDistance(
  row: number,
  col: number,
  placedWords: WordPlacement[]
): number {
  if (placedWords.length === 0) return 0;

  let totalDistance = 0;
  for (const word of placedWords) {
    const distance = Math.abs(row - word.row) + Math.abs(col - word.col);
    totalDistance += distance;
  }

  return totalDistance / placedWords.length;
}

/**
 * Remove empty rows and columns from the grid to create a compact puzzle
 */
function compactGrid(
  grid: (string | null)[][],
  words: WordPlacement[]
): {
  size: number;
  grid: (string | null)[][];
  words: WordPlacement[];
} {
  const gridSize = grid.length;

  // Find bounds of actual content
  let minRow = gridSize,
    maxRow = -1,
    minCol = gridSize,
    maxCol = -1;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  // Add padding around the content
  const padding = 0;
  minRow = Math.max(0, minRow - padding);
  maxRow = Math.min(gridSize - 1, maxRow + padding);
  minCol = Math.max(0, minCol - padding);
  maxCol = Math.min(gridSize - 1, maxCol + padding);

  // Create compacted grid
  const newSize = Math.max(maxRow - minRow + 1, maxCol - minCol + 1);
  const newGrid: (string | null)[][] = Array(newSize)
    .fill(null)
    .map(() => Array(newSize).fill(null));

  // Copy content to new grid
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      newGrid[r - minRow][c - minCol] = grid[r][c];
    }
  }

  // Adjust word positions
  const adjustedWords = words.map((word) => ({
    ...word,
    row: word.row - minRow,
    col: word.col - minCol,
  }));

  console.log(`[Crossword] Compacted grid from ${gridSize}x${gridSize} to ${newSize}x${newSize}`);

  return {
    size: newSize,
    grid: newGrid,
    words: adjustedWords,
  };
}

/**
 * Assign clue numbers to words in reading order
 * Numbers are assigned based on position (top-to-bottom, left-to-right)
 */
function assignClueNumbers(words: WordPlacement[]): PlacedWord[] {
  // Create a map of starting positions to track which cells start words
  const startPositions = new Map<string, WordPlacement[]>();

  for (const word of words) {
    const key = `${word.row},${word.col}`;
    if (!startPositions.has(key)) {
      startPositions.set(key, []);
    }
    startPositions.get(key)!.push(word);
  }

  // Sort positions by reading order (row first, then column)
  const sortedPositions = Array.from(startPositions.entries()).sort((a, b) => {
    const [aRow, aCol] = a[0].split(',').map(Number);
    const [bRow, bCol] = b[0].split(',').map(Number);

    if (aRow !== bRow) return aRow - bRow;
    return aCol - bCol;
  });

  // Assign numbers
  const numberedWords: PlacedWord[] = [];
  let clueNumber = 1;

  for (const [position, wordsAtPosition] of sortedPositions) {
    // All words starting at this position get the same number
    for (const word of wordsAtPosition) {
      numberedWords.push({
        number: clueNumber,
        word: word.word,
        clue: word.clue,
        answer: word.word,
        startRow: word.row,
        startCol: word.col,
        direction: word.direction,
      });
    }
    clueNumber++;
  }

  return numberedWords;
}

/**
 * Utility function to visualize the grid in console (for debugging)
 */
export function printGrid(puzzle: PuzzleGrid): void {
  console.log('\n=== Crossword Puzzle ===');
  console.log(`Size: ${puzzle.size}x${puzzle.size}`);
  console.log(`Words: ${puzzle.words.length}\n`);

  for (let r = 0; r < puzzle.size; r++) {
    let row = '';
    for (let c = 0; c < puzzle.size; c++) {
      row += puzzle.grid[r][c] || '█';
      row += ' ';
    }
    console.log(row);
  }

  console.log('\nClues:');
  const across = puzzle.words.filter((w) => w.direction === 'across');
  const down = puzzle.words.filter((w) => w.direction === 'down');

  console.log('ACROSS:');
  across.forEach((w) => console.log(`  ${w.number}. ${w.clue} (${w.answer})`));

  console.log('DOWN:');
  down.forEach((w) => console.log(`  ${w.number}. ${w.clue} (${w.answer})`));
}
