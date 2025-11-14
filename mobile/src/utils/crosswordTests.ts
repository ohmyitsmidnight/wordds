/**
 * Quick Start Guide - Testing the Crossword Generator
 * 
 * Run these functions in your app to test the crossword generation algorithm
 */

import { generateCrossword, WordInput, printGrid } from './crosswordGenerator';
import { generateReport } from './crosswordVisualization';

/**
 * QUICK TEST: Paste this in your app to see it work
 */
export function quickTest() {
  console.log('\n🎯 QUICK CROSSWORD GENERATOR TEST\n');

  // Define some vocabulary words
  const words: WordInput[] = [
    { word: 'SERENDIPITY', clue: 'Happy accident or fortunate discovery' },
    { word: 'EPHEMERAL', clue: 'Lasting for a very short time' },
    { word: 'RESILIENT', clue: 'Able to recover quickly from difficulties' },
    { word: 'ELOQUENT', clue: 'Fluent or persuasive in speaking' },
    { word: 'SUBTLE', clue: 'Not obvious or easily detected' },
    { word: 'KEEN', clue: 'Having a sharp edge or intense' },
    { word: 'ZEAL', clue: 'Great energy or enthusiasm' },
    { word: 'APT', clue: 'Appropriate or suitable' },
  ];

  // Generate the puzzle
  console.log('📝 Generating puzzle from', words.length, 'words...\n');
  const puzzle = generateCrossword(words, {
    maxAttempts: 150,
    minIntersections: 1,
  });

  if (!puzzle) {
    console.error('❌ Failed to generate puzzle');
    return;
  }

  // Print results
  console.log('✅ Success! Generated', puzzle.words.length, 'word puzzle\n');
  printGrid(puzzle);

  // Show detailed report
  console.log('\n📊 DETAILED REPORT:');
  console.log(generateReport(puzzle));

  return puzzle;
}

/**
 * Test with different difficulty levels
 */
export function testDifficulties() {
  const words: WordInput[] = [
    { word: 'COMPUTER', clue: 'Electronic device' },
    { word: 'INTERNET', clue: 'Global network' },
    { word: 'SOFTWARE', clue: 'Programs' },
    { word: 'KEYBOARD', clue: 'Input device' },
    { word: 'SCREEN', clue: 'Display' },
    { word: 'MOUSE', clue: 'Pointer' },
    { word: 'CODE', clue: 'Instructions' },
    { word: 'DATA', clue: 'Information' },
    { word: 'CLOUD', clue: 'Remote storage' },
    { word: 'SERVER', clue: 'Host computer' },
    { word: 'BYTE', clue: 'Unit of data' },
    { word: 'FILE', clue: 'Stored document' },
  ];

  console.log('\n🎮 TESTING DIFFERENT DIFFICULTIES\n');

  // Easy
  console.log('━━━━ EASY ━━━━');
  const easy = generateCrossword(
    words.filter(w => w.word.length <= 6).slice(0, 5),
    { minIntersections: 1 }
  );
  if (easy) printGrid(easy);

  // Medium
  console.log('\n━━━━ MEDIUM ━━━━');
  const medium = generateCrossword(
    words.filter(w => w.word.length >= 4 && w.word.length <= 8).slice(0, 8),
    { minIntersections: 1, maxAttempts: 100 }
  );
  if (medium) printGrid(medium);

  // Hard
  console.log('\n━━━━ HARD ━━━━');
  const hard = generateCrossword(words, {
    minIntersections: 2,
    maxAttempts: 200,
  });
  if (hard) printGrid(hard);
}

/**
 * Test with user's actual vocabulary (example)
 */
export function testWithVocabulary(userWords: Array<{ word: string; definition: string }>) {
  console.log('\n📚 GENERATING PUZZLE FROM YOUR VOCABULARY\n');

  // Convert user words to input format
  const wordInputs: WordInput[] = userWords.map(w => ({
    word: w.word,
    clue: w.definition,
  }));

  // Select 10-12 random words
  const selected = wordInputs
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);

  console.log(`Selected ${selected.length} words from your vocabulary\n`);

  // Generate puzzle
  const puzzle = generateCrossword(selected, {
    maxAttempts: 150,
    minIntersections: 1,
  });

  if (!puzzle) {
    console.error('❌ Could not generate puzzle');
    return null;
  }

  console.log('✅ Generated puzzle!');
  printGrid(puzzle);
  console.log('\n' + generateReport(puzzle));

  return puzzle;
}

/**
 * Performance test - measure generation speed
 */
export function performanceTest() {
  console.log('\n⚡ PERFORMANCE TEST\n');

  const testCases = [
    { size: 'Small (5 words)', words: 5 },
    { size: 'Medium (10 words)', words: 10 },
    { size: 'Large (15 words)', words: 15 },
  ];

  const baseWords: WordInput[] = [
    { word: 'AMAZING', clue: 'Causing great surprise' },
    { word: 'BRILLIANT', clue: 'Exceptionally clever' },
    { word: 'CREATIVE', clue: 'Involving imagination' },
    { word: 'DYNAMIC', clue: 'Characterized by energy' },
    { word: 'ELEGANT', clue: 'Graceful and stylish' },
    { word: 'FANTASTIC', clue: 'Extraordinarily good' },
    { word: 'GENUINE', clue: 'Truly what it is said to be' },
    { word: 'HARMONIOUS', clue: 'Forming a pleasing whole' },
    { word: 'INNOVATIVE', clue: 'Featuring new methods' },
    { word: 'JOYFUL', clue: 'Feeling great happiness' },
    { word: 'KIND', clue: 'Having a friendly nature' },
    { word: 'LUMINOUS', clue: 'Giving off light' },
    { word: 'MAGNIFICENT', clue: 'Extremely beautiful' },
    { word: 'NOBLE', clue: 'Having high moral qualities' },
    { word: 'OPTIMISTIC', clue: 'Hopeful about the future' },
  ];

  for (const testCase of testCases) {
    const words = baseWords.slice(0, testCase.words);
    
    const startTime = performance.now();
    const puzzle = generateCrossword(words, {
      maxAttempts: 100,
      minIntersections: 1,
    });
    const endTime = performance.now();
    
    const duration = (endTime - startTime).toFixed(2);
    
    console.log(`${testCase.size}:`);
    if (puzzle) {
      console.log(`  ✓ Generated in ${duration}ms`);
      console.log(`  ✓ Grid size: ${puzzle.size}×${puzzle.size}`);
      console.log(`  ✓ Words placed: ${puzzle.words.length}/${testCase.words}`);
    } else {
      console.log(`  ✗ Failed (${duration}ms)`);
    }
    console.log('');
  }
}

/**
 * Visual demo - shows generation process
 */
export function visualDemo() {
  console.log('\n🎨 VISUAL GENERATION DEMO\n');
  console.log('Watch as we build a puzzle step by step...\n');

  const words: WordInput[] = [
    { word: 'SWIFT', clue: 'Moving very fast' },
    { word: 'BRAVE', clue: 'Ready to face danger' },
    { word: 'WISE', clue: 'Having good judgment' },
    { word: 'TRUE', clue: 'In accordance with fact' },
    { word: 'FAIR', clue: 'Just and reasonable' },
  ];

  const puzzle = generateCrossword(words);

  if (puzzle) {
    console.log('📐 Final Grid:');
    printGrid(puzzle);
    
    console.log('\n📋 Clues:');
    const across = puzzle.words.filter(w => w.direction === 'across');
    const down = puzzle.words.filter(w => w.direction === 'down');
    
    console.log('\nACROSS:');
    across.forEach(w => console.log(`  ${w.number}. ${w.clue}`));
    
    console.log('\nDOWN:');
    down.forEach(w => console.log(`  ${w.number}. ${w.clue}`));
  }
}

// Export a single function to run all tests
export function runAllTests() {
  console.clear();
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  CROSSWORD GENERATOR - COMPLETE TEST SUITE  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  try {
    quickTest();
    testDifficulties();
    performanceTest();
    visualDemo();
    
    console.log('\n✅ ALL TESTS COMPLETED!\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
  }
}
