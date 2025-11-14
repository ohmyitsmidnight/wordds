# Crossword Puzzle Generation Algorithm

## Overview

This is a custom-built crossword puzzle generation algorithm designed specifically for the Wordds app. It takes a list of vocabulary words with their definitions and automatically generates valid crossword puzzle grids where words intersect at common letters.

## Algorithm Architecture

### Core Components

1. **Word Placement Engine** (`crosswordGenerator.ts`)
   - Main generation logic
   - Grid management and validation
   - Intersection detection
   - Placement scoring

2. **Example Usage** (`crosswordExamples.ts`)
   - Sample puzzles and demonstrations
   - Difficulty-based generation
   - Testing utilities

## How It Works

### Step-by-Step Process

#### 1. Word Preparation
```
Input: List of words with clues
↓
Normalize: Convert to uppercase, validate format
↓
Sort: Longest words first (better grid utilization)
```

#### 2. Grid Initialization
```
Create oversized grid (word_length × 3)
↓
Place first word horizontally in center (anchor)
```

#### 3. Iterative Word Placement
For each remaining word:
```
Find all possible intersections with placed words
↓
Calculate placement positions based on intersections
↓
Validate each position (no conflicts, proper spacing)
↓
Score placements (intersections, density, layout)
↓
Select best placement or skip if no valid option
```

#### 4. Grid Optimization
```
Remove empty rows and columns
↓
Compact to minimum bounding box
↓
Assign clue numbers (reading order)
```

## Key Features

### 1. Intelligent Intersection Finding
- Scans each letter of new word against all letters in placed words
- Finds all possible common letter matches
- Calculates perpendicular placement positions

### 2. Conflict Detection
The algorithm validates placements by checking:
- **Bounds**: Word fits within grid
- **Letter conflicts**: Cells either empty or contain same letter
- **Adjacent words**: No invalid side-by-side words
- **End spacing**: Black cells before/after words

### 3. Placement Scoring
Placements are scored based on:
- **Intersections** (+10 points each): More intersections = better grid
- **Grid density** (+5-10 points): Prefer compact layouts
- **Word length optimization** (-5 penalty): Long words need intersections

### 4. Adaptive Generation
- Multiple placement attempts per word (configurable)
- Minimum intersection requirements
- Fallback strategies for difficult words

## Usage Examples

### Basic Usage
```typescript
import { generateCrossword, WordInput } from './crosswordGenerator';

const words: WordInput[] = [
  { word: 'COFFEE', clue: 'Morning beverage' },
  { word: 'OCEAN', clue: 'Large body of water' },
  { word: 'NIGHT', clue: 'Opposite of day' },
];

const puzzle = generateCrossword(words);

if (puzzle) {
  console.log('Grid size:', puzzle.size);
  console.log('Words placed:', puzzle.words.length);
}
```

### Advanced Configuration
```typescript
const puzzle = generateCrossword(words, {
  maxAttempts: 100,        // More attempts = better results
  minIntersections: 2,     // Require more intersections
  gridPadding: 1,          // Extra space around grid
});
```

### Difficulty-Based Generation
```typescript
import { generatePuzzleForApp } from './crosswordExamples';

// Easy: 3-5 letter words, 6 words max
const easyPuzzle = generatePuzzleForApp(userWords, {
  difficulty: 'easy',
  maxWords: 6,
});

// Medium: 4-8 letter words, 10-12 words
const mediumPuzzle = generatePuzzleForApp(userWords, {
  difficulty: 'medium',
  maxWords: 10,
});

// Hard: All lengths, 15+ words, more intersections
const hardPuzzle = generatePuzzleForApp(userWords, {
  difficulty: 'hard',
  maxWords: 15,
});
```

## Algorithm Parameters

### Input Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `words` | `WordInput[]` | required | Array of words with clues |
| `maxAttempts` | `number` | 50 | Max placement tries per word |
| `minIntersections` | `number` | 1 | Min intersections to accept placement |
| `gridPadding` | `number` | 2 | Extra space around grid |

### Output Format

```typescript
interface PuzzleGrid {
  size: number;                    // Grid dimension (NxN)
  words: PlacedWord[];            // All placed words with positions
  grid: (string | null)[][];      // 2D grid of letters
}

interface PlacedWord {
  number: number;                 // Clue number
  word: string;                   // Original word
  clue: string;                   // Clue text
  answer: string;                 // Answer (same as word)
  startRow: number;               // Starting row position
  startCol: number;               // Starting column position
  direction: 'across' | 'down';   // Word direction
}
```

## Performance Characteristics

### Time Complexity
- **Best case**: O(n²) - All words placed on first attempt
- **Average case**: O(n² × m) - Multiple attempts needed (m = maxAttempts)
- **Worst case**: O(n³ × m) - Complex intersection calculations

Where `n` = number of words

### Space Complexity
- **Grid storage**: O(s²) where s = grid size
- **Word tracking**: O(n) where n = number of words
- **Total**: O(s² + n)

### Optimization Strategies
1. **Early termination**: Stop if no valid placements found
2. **Greedy placement**: Always use highest scored placement
3. **Grid compaction**: Minimize final grid size
4. **Sorted words**: Longer words first improves success rate

## Edge Cases Handled

### 1. No Common Letters
```typescript
// Words: BCD, FGH, JKL (no shared letters)
// Result: First word placed, others skipped
// Returns valid puzzle with 1 word
```

### 2. Too Few Words
```typescript
// Input: 1-2 words
// Result: Returns null (minimum 3 words needed)
```

### 3. Very Long Words
```typescript
// Input: ANTIDISESTABLISHMENTARIANISM
// Result: Handled correctly, may dominate grid
```

### 4. All Same Letters
```typescript
// Input: AAA, AAAA, AAAAA
// Result: Multiple intersections, compact grid
```

## Testing

Run the built-in tests:
```typescript
import { runTests } from './crosswordExamples';

runTests(); // Validates edge cases and basic functionality
```

Test output includes:
- Empty word list handling
- Single word handling  
- No common letters scenario
- Many common letters scenario
- Mixed length words

## Integration with Wordds App

### 1. Vocabulary-Based Puzzles
```typescript
// Get user's learned words from store
const userWords = useWordsStore.getState().words;

// Convert to WordInput format
const wordInputs = userWords.map(w => ({
  word: w.word,
  clue: w.definition || w.custom_definition,
}));

// Generate puzzle
const puzzle = generatePuzzleForApp(wordInputs, {
  difficulty: user.preferences.difficulty_level,
  maxWords: 12,
});
```

### 2. Adaptive Difficulty
The algorithm adjusts based on user performance:
- **New users**: Easy puzzles (short words, few intersections)
- **Intermediate**: Medium puzzles (mixed lengths, moderate intersections)
- **Advanced**: Hard puzzles (long words, high intersection requirements)

### 3. Daily Challenges
```typescript
// Generate consistent puzzle for a given date
const seed = new Date().toISOString().split('T')[0];
const dailyWords = selectWordsWithSeed(userWords, seed);
const dailyPuzzle = generateCrossword(dailyWords);
```

## Future Enhancements

### Planned Features
1. **Symmetry Support**: Generate symmetric grids (180° rotation)
2. **Themed Shapes**: Create grids in specific patterns
3. **Difficulty Scoring**: Automatic puzzle difficulty calculation
4. **Hint Generation**: Smart hints based on intersections
5. **Multi-language**: Support for non-English alphabets

### Performance Improvements
1. **Parallel Processing**: Use Web Workers for generation
2. **Caching**: Save generated puzzles for reuse
3. **Genetic Algorithms**: Optimize word placement
4. **Machine Learning**: Learn from user solving patterns

## Technical Notes

### Why This Approach?

1. **Deterministic**: Same words always generate similar layouts
2. **Fast**: Generates most puzzles in < 100ms
3. **Flexible**: Highly configurable for different use cases
4. **Robust**: Handles edge cases gracefully
5. **Offline**: No API calls, works without internet

### Comparison to Other Methods

| Method | Speed | Quality | Complexity |
|--------|-------|---------|------------|
| **Greedy (Ours)** | Fast | Good | Low |
| Backtracking | Slow | Best | High |
| Constraint Satisfaction | Medium | Good | Medium |
| Genetic Algorithm | Slow | Variable | High |

Our greedy approach balances speed and quality, perfect for mobile apps where generation happens in real-time.

## License

This algorithm is proprietary to the Wordds application. All rights reserved.

## Support

For questions or issues with the crossword generation algorithm:
- Check the inline comments in `crosswordGenerator.ts`
- Review example usage in `crosswordExamples.ts`
- Run tests with `runTests()` to validate behavior
