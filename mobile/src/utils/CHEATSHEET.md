/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                  CROSSWORD ALGORITHM CHEAT SHEET                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
 * 
 * Quick reference for using the crossword generation algorithm
 */

// ═══════════════════════════════════════════════════════════════════
// BASIC USAGE
// ═══════════════════════════════════════════════════════════════════

import { generateCrossword, WordInput, PuzzleGrid } from './crosswordGenerator';

// 1. Define your words
const words: WordInput[] = [
  { word: 'EXAMPLE', clue: 'A sample or instance' },
  { word: 'SIMPLE', clue: 'Easy to understand' },
  { word: 'PUZZLE', clue: 'A game or problem' },
];

// 2. Generate puzzle
const puzzle = generateCrossword(words);

// 3. Use the result
if (puzzle) {
  console.log('Grid size:', puzzle.size);
  console.log('Words:', puzzle.words.length);
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION OPTIONS
// ═══════════════════════════════════════════════════════════════════

generateCrossword(words, {
  maxAttempts: 50,        // Default: 50, Range: 10-200
  minIntersections: 1,    // Default: 1, Range: 1-3
  gridPadding: 2,         // Default: 2, Range: 0-5
});

// ═══════════════════════════════════════════════════════════════════
// DIFFICULTY PRESETS
// ═══════════════════════════════════════════════════════════════════

import { generatePuzzleForApp } from './crosswordExamples';

// Easy: 3-5 letter words, 6 words max
const easy = generatePuzzleForApp(words, {
  difficulty: 'easy',
  maxWords: 6,
});

// Medium: 4-8 letter words, 10-12 words
const medium = generatePuzzleForApp(words, {
  difficulty: 'medium',
  maxWords: 10,
});

// Hard: All lengths, 15 words, more intersections
const hard = generatePuzzleForApp(words, {
  difficulty: 'hard',
  maxWords: 15,
});

// ═══════════════════════════════════════════════════════════════════
// DEBUGGING & VISUALIZATION
// ═══════════════════════════════════════════════════════════════════

import { printGrid } from './crosswordGenerator';
import { generateReport, analyzeDifficulty, validatePuzzle } from './crosswordVisualization';

// Print ASCII grid
printGrid(puzzle);

// Full detailed report
console.log(generateReport(puzzle));

// Check difficulty
const diff = analyzeDifficulty(puzzle);
console.log(diff.level); // 'easy' | 'medium' | 'hard' | 'expert'

// Validate correctness
const valid = validatePuzzle(puzzle);
if (!valid.valid) console.error(valid.errors);

// ═══════════════════════════════════════════════════════════════════
// REACT COMPONENT USAGE
// ═══════════════════════════════════════════════════════════════════

function MyPuzzleScreen() {
  const [puzzle, setPuzzle] = useState<PuzzleGrid | null>(null);

  useEffect(() => {
    const words = [
      { word: 'REACT', clue: 'JavaScript library' },
      { word: 'NATIVE', clue: 'Built for mobile' },
    ];
    
    const generated = generateCrossword(words);
    setPuzzle(generated);
  }, []);

  if (!puzzle) return <Loading />;

  return (
    <CrosswordGrid
      size={puzzle.size}
      words={puzzle.words}
      onComplete={() => console.log('Done!')}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMMON PATTERNS
// ═══════════════════════════════════════════════════════════════════

// Pattern 1: Random subset from large word list
const selectRandom = (words: WordInput[], count: number) => {
  return words.sort(() => Math.random() - 0.5).slice(0, count);
};

// Pattern 2: Filter by word length
const shortWords = words.filter(w => w.word.length <= 6);
const longWords = words.filter(w => w.word.length >= 8);

// Pattern 3: Generate multiple attempts (find best)
const attempts = Array(5).fill(0).map(() => generateCrossword(words));
const best = attempts
  .filter(p => p !== null)
  .sort((a, b) => b.words.length - a.words.length)[0];

// Pattern 4: From database words
const fromDB = (dbWords: Array<{ word: string; definition: string }>) => {
  const inputs = dbWords.map(w => ({ word: w.word, clue: w.definition }));
  return generateCrossword(inputs);
};

// ═══════════════════════════════════════════════════════════════════
// TESTING
// ═══════════════════════════════════════════════════════════════════

import { quickTest, runAllTests, performanceTest } from './crosswordTests';

quickTest();           // Quick demo
performanceTest();     // Speed benchmarks
runAllTests();         // Full test suite

// ═══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

interface WordInput {
  word: string;    // The word to place (uppercase letters only)
  clue: string;    // The clue/definition for the word
}

interface PuzzleGrid {
  size: number;                    // Grid dimension (N×N)
  words: PlacedWord[];            // All placed words
  grid: (string | null)[][];      // 2D grid (null = black cell)
}

interface PlacedWord {
  number: number;                 // Clue number
  word: string;                   // Original word
  clue: string;                   // Clue text
  answer: string;                 // Answer (same as word)
  startRow: number;               // Starting row (0-indexed)
  startCol: number;               // Starting column (0-indexed)
  direction: 'across' | 'down';   // Word direction
}

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE TIPS
// ═══════════════════════════════════════════════════════════════════

// ✓ Use 8-12 words for optimal generation time
// ✓ Increase maxAttempts if words aren't placing
// ✓ Sort words by length (done automatically)
// ✓ Choose words with common letters for better intersections
// ✓ Generation is synchronous - use async wrapper if needed
// ✓ Cache generated puzzles instead of regenerating

// ═══════════════════════════════════════════════════════════════════
// TROUBLESHOOTING
// ═══════════════════════════════════════════════════════════════════

// Problem: Returns null
// Solution: 
//   - Check if words have common letters
//   - Increase maxAttempts (50 → 100 → 200)
//   - Decrease minIntersections (2 → 1)
//   - Ensure at least 3 words provided

// Problem: Too few words placed
// Solution:
//   - Use words with common vowels (A, E, I, O, U)
//   - Increase maxAttempts
//   - Try different word combinations

// Problem: Slow generation
// Solution:
//   - Reduce number of words (< 15)
//   - Lower maxAttempts
//   - Use shorter words

// ═══════════════════════════════════════════════════════════════════
// FILE LOCATIONS
// ═══════════════════════════════════════════════════════════════════

// Core Algorithm:        src/utils/crosswordGenerator.ts
// Examples & Helpers:    src/utils/crosswordExamples.ts
// Visualization:         src/utils/crosswordVisualization.ts
// Tests:                 src/utils/crosswordTests.ts
// Documentation:         docs/CROSSWORD_ALGORITHM.md
// Integration Guide:     CROSSWORD_INTEGRATION.md

// ═══════════════════════════════════════════════════════════════════
// SUPPORT
// ═══════════════════════════════════════════════════════════════════

// All functions have detailed inline comments
// Check the main files for comprehensive explanations
// Run tests to see examples in action
// Read docs/CROSSWORD_ALGORITHM.md for deep dive

export {}; // Make this a module
