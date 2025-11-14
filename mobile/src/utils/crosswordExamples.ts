/**
 * Example usage and tests for the Crossword Generator
 * 
 * This file demonstrates how to use the crossword generation algorithm
 * with various word lists and configurations.
 */

import { generateCrossword, printGrid, WordInput } from './crosswordGenerator';

/**
 * Example 1: Simple word list
 */
export function generateSimplePuzzle(): void {
  console.log('\n========== SIMPLE PUZZLE ==========');

  const words: WordInput[] = [
    { word: 'CAT', clue: 'Feline pet' },
    { word: 'DOG', clue: 'Canine companion' },
    { word: 'RAT', clue: 'Small rodent' },
    { word: 'BAT', clue: 'Flying mammal' },
    { word: 'HAT', clue: 'Head covering' },
  ];

  const puzzle = generateCrossword(words);

  if (puzzle) {
    printGrid(puzzle);
  } else {
    console.error('Failed to generate puzzle');
  }
}

/**
 * Example 2: Medium difficulty puzzle with longer words
 */
export function generateMediumPuzzle(): void {
  console.log('\n========== MEDIUM PUZZLE ==========');

  const words: WordInput[] = [
    { word: 'COFFEE', clue: 'Morning beverage' },
    { word: 'OCEAN', clue: 'Large body of water' },
    { word: 'FOREST', clue: 'Dense woodland' },
    { word: 'NIGHT', clue: 'Opposite of day' },
    { word: 'ORANGE', clue: 'Citrus fruit' },
    { word: 'BANANA', clue: 'Yellow fruit' },
    { word: 'STAR', clue: 'Celestial object' },
    { word: 'MOON', clue: 'Earth\'s satellite' },
  ];

  const puzzle = generateCrossword(words, {
    maxAttempts: 100,
    minIntersections: 1,
  });

  if (puzzle) {
    printGrid(puzzle);
  } else {
    console.error('Failed to generate puzzle');
  }
}

/**
 * Example 3: Themed puzzle - Technology
 */
export function generateTechPuzzle(): void {
  console.log('\n========== TECHNOLOGY PUZZLE ==========');

  const words: WordInput[] = [
    { word: 'COMPUTER', clue: 'Electronic device for processing data' },
    { word: 'INTERNET', clue: 'Global network of networks' },
    { word: 'SOFTWARE', clue: 'Programs and operating systems' },
    { word: 'MOUSE', clue: 'Pointing device' },
    { word: 'KEYBOARD', clue: 'Input device with keys' },
    { word: 'SCREEN', clue: 'Display monitor' },
    { word: 'CODE', clue: 'Programming instructions' },
    { word: 'DATA', clue: 'Information in digital form' },
    { word: 'CLOUD', clue: 'Remote data storage' },
    { word: 'SERVER', clue: 'Computer that provides resources' },
  ];

  const puzzle = generateCrossword(words, {
    maxAttempts: 150,
    minIntersections: 2,
  });

  if (puzzle) {
    printGrid(puzzle);
  } else {
    console.error('Failed to generate puzzle');
  }
}

/**
 * Example 4: Generate puzzle from user's vocabulary words
 * This simulates how the app would generate puzzles from learned words
 */
export function generateVocabularyPuzzle(vocabularyWords: WordInput[]): void {
  console.log('\n========== VOCABULARY PUZZLE ==========');
  console.log(`Generating puzzle from ${vocabularyWords.length} vocabulary words`);

  // Select random subset of words for puzzle (typically 8-15 words)
  const numWords = Math.min(12, vocabularyWords.length);
  const selectedWords = vocabularyWords
    .sort(() => Math.random() - 0.5) // Shuffle
    .slice(0, numWords);

  const puzzle = generateCrossword(selectedWords, {
    maxAttempts: 200,
    minIntersections: 1,
  });

  if (puzzle) {
    printGrid(puzzle);
  } else {
    console.error('Failed to generate puzzle');
  }
}

/**
 * Example 5: Difficulty-based generation
 * Generate puzzles with different difficulty levels
 */
export function generatePuzzleByDifficulty(
  words: WordInput[],
  difficulty: 'easy' | 'medium' | 'hard'
): void {
  console.log(`\n========== ${difficulty.toUpperCase()} PUZZLE ==========`);

  // Filter words by length based on difficulty
  let filteredWords: WordInput[];
  let numWords: number;
  let minIntersections: number;

  switch (difficulty) {
    case 'easy':
      // Short words, fewer words, fewer required intersections
      filteredWords = words.filter((w) => w.word.length >= 3 && w.word.length <= 5);
      numWords = Math.min(6, filteredWords.length);
      minIntersections = 1;
      break;

    case 'medium':
      // Medium length words, moderate number
      filteredWords = words.filter((w) => w.word.length >= 4 && w.word.length <= 8);
      numWords = Math.min(10, filteredWords.length);
      minIntersections = 1;
      break;

    case 'hard':
      // All word lengths, more words, more intersections required
      filteredWords = words;
      numWords = Math.min(15, filteredWords.length);
      minIntersections = 2;
      break;
  }

  const selectedWords = filteredWords
    .sort(() => Math.random() - 0.5)
    .slice(0, numWords);

  const puzzle = generateCrossword(selectedWords, {
    maxAttempts: 200,
    minIntersections,
  });

  if (puzzle) {
    printGrid(puzzle);
  } else {
    console.error('Failed to generate puzzle');
  }
}

/**
 * Test function to validate algorithm with edge cases
 */
export function runTests(): void {
  console.log('\n========== RUNNING TESTS ==========\n');

  // Test 1: Empty word list
  console.log('Test 1: Empty word list');
  const result1 = generateCrossword([]);
  console.log('Result:', result1 === null ? 'PASS ✓' : 'FAIL ✗');

  // Test 2: Single word
  console.log('\nTest 2: Single word');
  const result2 = generateCrossword([{ word: 'TEST', clue: 'A test' }]);
  console.log('Result:', result2 === null ? 'PASS ✓' : 'FAIL ✗');

  // Test 3: Words with no common letters
  console.log('\nTest 3: Words with no common letters');
  const result3 = generateCrossword([
    { word: 'BCD', clue: 'Test 1' },
    { word: 'FGH', clue: 'Test 2' },
    { word: 'JKL', clue: 'Test 3' },
  ]);
  console.log('Result:', result3 !== null ? 'PASS ✓' : 'FAIL ✗');

  // Test 4: Words with many common letters
  console.log('\nTest 4: Words with many common letters');
  const result4 = generateCrossword([
    { word: 'AREA', clue: 'Surface extent' },
    { word: 'RARE', clue: 'Uncommon' },
    { word: 'REAR', clue: 'Back part' },
    { word: 'EARN', clue: 'Make money' },
  ]);
  console.log('Result:', result4 !== null ? 'PASS ✓' : 'FAIL ✗');
  if (result4) printGrid(result4);

  // Test 5: Mixed length words
  console.log('\nTest 5: Mixed length words');
  const result5 = generateCrossword([
    { word: 'A', clue: 'Letter' },
    { word: 'MEDIUM', clue: 'Middle size' },
    { word: 'VERYLONGWORD', clue: 'Extended text' },
  ]);
  console.log('Result:', result5 !== null ? 'PASS ✓' : 'FAIL ✗');

  console.log('\n========== TESTS COMPLETE ==========\n');
}

// Example export for use in React components
export function generatePuzzleForApp(
  userWords: WordInput[],
  options?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    maxWords?: number;
  }
) {
  const { difficulty = 'medium', maxWords = 12 } = options || {};

  // Filter and select words based on difficulty
  let selectedWords = userWords;

  if (difficulty === 'easy') {
    selectedWords = userWords.filter((w) => w.word.length >= 3 && w.word.length <= 5);
  } else if (difficulty === 'medium') {
    selectedWords = userWords.filter((w) => w.word.length >= 4 && w.word.length <= 8);
  }

  // Randomly select words
  const numWords = Math.min(maxWords, selectedWords.length);
  const words = selectedWords
    .sort(() => Math.random() - 0.5)
    .slice(0, numWords);

  // Generate puzzle
  return generateCrossword(words, {
    maxAttempts: 200,
    minIntersections: difficulty === 'hard' ? 2 : 1,
  });
}
