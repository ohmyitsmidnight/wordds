/**
 * Crossword Puzzle Visualization Utilities
 * 
 * Helper functions to visualize and debug crossword puzzles
 */

import { PuzzleGrid, PlacedWord } from './crosswordGenerator';

/**
 * Generate an ASCII representation of the puzzle grid
 * Useful for console debugging and logging
 */
export function gridToASCII(puzzle: PuzzleGrid): string {
  let output = '\n';
  
  // Top border
  output += '╔' + '═══╦'.repeat(puzzle.size - 1) + '═══╗\n';
  
  for (let r = 0; r < puzzle.size; r++) {
    // Row content
    output += '║';
    for (let c = 0; c < puzzle.size; c++) {
      const cell = puzzle.grid[r][c];
      
      // Check if this cell starts a word (has a number)
      const word = puzzle.words.find(
        w => w.startRow === r && w.startCol === c
      );
      
      if (cell === null) {
        output += '███'; // Black cell
      } else if (word) {
        // Cell with number
        output += ` ${word.number.toString().padStart(1)} `;
      } else {
        output += ` ${cell} `;
      }
      
      output += '║';
    }
    output += '\n';
    
    // Row separator (except last row)
    if (r < puzzle.size - 1) {
      output += '╠' + '═══╬'.repeat(puzzle.size - 1) + '═══╣\n';
    }
  }
  
  // Bottom border
  output += '╚' + '═══╩'.repeat(puzzle.size - 1) + '═══╝\n';
  
  return output;
}

/**
 * Generate a detailed puzzle summary
 */
export function puzzleSummary(puzzle: PuzzleGrid): string {
  const across = puzzle.words.filter(w => w.direction === 'across');
  const down = puzzle.words.filter(w => w.direction === 'down');
  
  let summary = '\n';
  summary += '╔════════════════════════════════════════╗\n';
  summary += '║     CROSSWORD PUZZLE SUMMARY          ║\n';
  summary += '╚════════════════════════════════════════╝\n\n';
  
  summary += `Grid Size: ${puzzle.size} × ${puzzle.size}\n`;
  summary += `Total Words: ${puzzle.words.length}\n`;
  summary += `Across: ${across.length} | Down: ${down.length}\n`;
  summary += `\n`;
  
  // Calculate statistics
  const totalCells = puzzle.size * puzzle.size;
  const filledCells = puzzle.grid.flat().filter(c => c !== null).length;
  const fillPercentage = ((filledCells / totalCells) * 100).toFixed(1);
  
  summary += `Grid Density: ${fillPercentage}%\n`;
  summary += `Filled Cells: ${filledCells}/${totalCells}\n`;
  
  // Word length distribution
  const lengths = puzzle.words.map(w => w.answer.length);
  const avgLength = (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1);
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);
  
  summary += `\nWord Lengths: ${minLength}-${maxLength} (avg: ${avgLength})\n`;
  
  return summary;
}

/**
 * Generate clue list formatted for display
 */
export function formatClues(puzzle: PuzzleGrid): string {
  const across = puzzle.words
    .filter(w => w.direction === 'across')
    .sort((a, b) => a.number - b.number);
  
  const down = puzzle.words
    .filter(w => w.direction === 'down')
    .sort((a, b) => a.number - b.number);
  
  let output = '\n';
  
  if (across.length > 0) {
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '           ACROSS\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    across.forEach(word => {
      output += `${word.number.toString().padStart(2)}. ${word.clue}\n`;
      output += `    (${word.answer.length} letters)\n`;
    });
  }
  
  if (down.length > 0) {
    output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '            DOWN\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    down.forEach(word => {
      output += `${word.number.toString().padStart(2)}. ${word.clue}\n`;
      output += `    (${word.answer.length} letters)\n`;
    });
  }
  
  return output;
}

/**
 * Analyze puzzle difficulty based on various factors
 */
export function analyzeDifficulty(puzzle: PuzzleGrid): {
  score: number;
  level: 'easy' | 'medium' | 'hard' | 'expert';
  factors: string[];
} {
  const factors: string[] = [];
  let score = 0;
  
  // Factor 1: Number of words
  if (puzzle.words.length >= 15) {
    score += 3;
    factors.push('Many words (15+)');
  } else if (puzzle.words.length >= 10) {
    score += 2;
    factors.push('Moderate word count (10-14)');
  } else {
    score += 1;
    factors.push('Few words (<10)');
  }
  
  // Factor 2: Grid size
  if (puzzle.size >= 15) {
    score += 3;
    factors.push('Large grid (15×15+)');
  } else if (puzzle.size >= 10) {
    score += 2;
    factors.push('Medium grid (10×14)');
  } else {
    score += 1;
    factors.push('Small grid (<10)');
  }
  
  // Factor 3: Average word length
  const avgLength = puzzle.words.reduce((sum, w) => sum + w.answer.length, 0) / puzzle.words.length;
  if (avgLength >= 8) {
    score += 3;
    factors.push('Long words (avg 8+ letters)');
  } else if (avgLength >= 6) {
    score += 2;
    factors.push('Medium words (avg 6-7 letters)');
  } else {
    score += 1;
    factors.push('Short words (avg <6 letters)');
  }
  
  // Factor 4: Grid density (intersections)
  const totalCells = puzzle.size * puzzle.size;
  const filledCells = puzzle.grid.flat().filter(c => c !== null).length;
  const density = filledCells / totalCells;
  
  if (density >= 0.6) {
    score += 3;
    factors.push('High density (60%+ filled)');
  } else if (density >= 0.4) {
    score += 2;
    factors.push('Medium density (40-60% filled)');
  } else {
    score += 1;
    factors.push('Low density (<40% filled)');
  }
  
  // Determine level based on score
  let level: 'easy' | 'medium' | 'hard' | 'expert';
  if (score <= 5) level = 'easy';
  else if (score <= 8) level = 'medium';
  else if (score <= 11) level = 'hard';
  else level = 'expert';
  
  return { score, level, factors };
}

/**
 * Validate puzzle correctness
 */
export function validatePuzzle(puzzle: PuzzleGrid): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check 1: All words placed correctly in grid
  for (const word of puzzle.words) {
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.direction === 'across' ? word.startRow : word.startRow + i;
      const c = word.direction === 'across' ? word.startCol + i : word.startCol;
      
      if (r >= puzzle.size || c >= puzzle.size) {
        errors.push(`Word ${word.number} extends beyond grid bounds`);
        continue;
      }
      
      if (puzzle.grid[r][c] !== word.answer[i]) {
        errors.push(`Word ${word.number} has incorrect letter at position ${i}`);
      }
    }
  }
  
  // Check 2: No duplicate clue numbers for different words
  const numbers = new Map<number, PlacedWord[]>();
  for (const word of puzzle.words) {
    if (!numbers.has(word.number)) {
      numbers.set(word.number, []);
    }
    numbers.get(word.number)!.push(word);
  }
  
  for (const [num, words] of numbers) {
    if (words.length > 2) {
      errors.push(`Clue number ${num} used by ${words.length} words`);
    }
    // Same number is OK if words start at same position (one across, one down)
    if (words.length === 2) {
      if (words[0].startRow !== words[1].startRow || words[0].startCol !== words[1].startCol) {
        errors.push(`Clue number ${num} used at different positions`);
      }
    }
  }
  
  // Check 3: Grid size matches
  if (puzzle.grid.length !== puzzle.size || puzzle.grid[0].length !== puzzle.size) {
    errors.push(`Grid dimensions don't match size property`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export puzzle in JSON format for saving
 */
export function exportPuzzle(puzzle: PuzzleGrid): string {
  return JSON.stringify(puzzle, null, 2);
}

/**
 * Complete puzzle report for debugging
 */
export function generateReport(puzzle: PuzzleGrid): string {
  let report = '';
  
  report += gridToASCII(puzzle);
  report += puzzleSummary(puzzle);
  report += formatClues(puzzle);
  
  const difficulty = analyzeDifficulty(puzzle);
  report += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  report += '       DIFFICULTY ANALYSIS\n';
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  report += `Level: ${difficulty.level.toUpperCase()}\n`;
  report += `Score: ${difficulty.score}/12\n`;
  report += `Factors:\n`;
  difficulty.factors.forEach(f => report += `  • ${f}\n`);
  
  const validation = validatePuzzle(puzzle);
  report += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  report += '         VALIDATION\n';
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  report += `Status: ${validation.valid ? '✓ VALID' : '✗ INVALID'}\n`;
  if (validation.errors.length > 0) {
    report += 'Errors:\n';
    validation.errors.forEach(e => report += `  • ${e}\n`);
  }
  
  return report;
}
