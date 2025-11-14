import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const MAX_GRID_SIZE = width - GRID_PADDING * 2;

interface Cell {
  letter: string | null; // User's input
  answer: string | null; // Correct answer
  number?: number; // Clue number if cell starts a word
  isBlack: boolean; // Black/blocked cell
}

interface Word {
  number: number;
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
}

interface CrosswordGridProps {
  size: number; // Grid dimension (e.g., 5 for 5x5)
  words: Word[];
  onComplete?: () => void;
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  size,
  words,
  onComplete,
}) => {
  // Initialize grid
  const initializeGrid = (): Cell[][] => {
    const grid: Cell[][] = Array(size)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(null)
          .map(() => ({
            letter: null,
            answer: null,
            isBlack: true,
          }))
      );

    // Place words in grid
    words.forEach((word) => {
      const { answer, startRow, startCol, direction, number } = word;
      for (let i = 0; i < answer.length; i++) {
        const row = direction === 'across' ? startRow : startRow + i;
        const col = direction === 'across' ? startCol + i : startCol;

        if (row < size && col < size) {
          grid[row][col].answer = answer[i];
          grid[row][col].isBlack = false;
          if (i === 0) {
            grid[row][col].number = number;
          }
        }
      }
    });

    return grid;
  };

  const [grid, setGrid] = useState<Cell[][]>(initializeGrid());
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const shakeValue = useSharedValue(0);
  const successScale = useSharedValue(1);

  const cellSize = (MAX_GRID_SIZE - (size + 1) * 2) / size;

  // Get current word based on selection and direction
  const getCurrentWord = () => {
    if (!selectedCell) return null;
    const { row, col } = selectedCell;

    return words.find((word) => {
      if (word.direction !== direction) return false;
      if (direction === 'across') {
        return (
          word.startRow === row &&
          col >= word.startCol &&
          col < word.startCol + word.answer.length
        );
      } else {
        return (
          word.startCol === col &&
          row >= word.startRow &&
          row < word.startRow + word.answer.length
        );
      }
    });
  };

  // Handle cell press
  const handleCellPress = (row: number, col: number) => {
    if (grid[row][col].isBlack) return;

    // If same cell pressed, toggle direction
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setDirection((prev) => (prev === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell({ row, col });
    }

    // Focus input for keyboard
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Handle letter input
  const handleLetterInput = (letter: string) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    const upperLetter = letter.toUpperCase();
    if (!/^[A-Z]$/.test(upperLetter)) return;

    // Update grid with user input
    const newGrid = [...grid];
    newGrid[row][col] = { ...newGrid[row][col], letter: upperLetter };
    setGrid(newGrid);

    // Move to next cell in current word
    moveToNextCell();
  };

  // Move to next empty cell in current word
  const moveToNextCell = () => {
    if (!selectedCell) return;
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    const { row, col } = selectedCell;
    let nextRow = row;
    let nextCol = col;

    if (direction === 'across') {
      nextCol++;
      if (nextCol >= currentWord.startCol + currentWord.answer.length) {
        return; // End of word
      }
    } else {
      nextRow++;
      if (nextRow >= currentWord.startRow + currentWord.answer.length) {
        return; // End of word
      }
    }

    if (nextRow < size && nextCol < size && !grid[nextRow][nextCol].isBlack) {
      setSelectedCell({ row: nextRow, col: nextCol });
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    // Clear current cell
    const newGrid = [...grid];
    if (newGrid[row][col].letter) {
      newGrid[row][col] = { ...newGrid[row][col], letter: null };
      setGrid(newGrid);
    } else {
      // Move to previous cell if current is empty
      moveToPreviousCell();
    }
  };

  // Move to previous cell
  const moveToPreviousCell = () => {
    if (!selectedCell) return;
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    const { row, col } = selectedCell;
    let prevRow = row;
    let prevCol = col;

    if (direction === 'across') {
      prevCol--;
      if (prevCol < currentWord.startCol) return;
    } else {
      prevRow--;
      if (prevRow < currentWord.startRow) return;
    }

    if (prevRow >= 0 && prevCol >= 0 && !grid[prevRow][prevCol].isBlack) {
      setSelectedCell({ row: prevRow, col: prevCol });
    }
  };

  // Check if cell is in current word
  const isCellInCurrentWord = (row: number, col: number) => {
    const currentWord = getCurrentWord();
    if (!currentWord) return false;

    if (direction === 'across') {
      return (
        currentWord.startRow === row &&
        col >= currentWord.startCol &&
        col < currentWord.startCol + currentWord.answer.length
      );
    } else {
      return (
        currentWord.startCol === col &&
        row >= currentWord.startRow &&
        row < currentWord.startRow + currentWord.answer.length
      );
    }
  };

  // Check puzzle completion
  useEffect(() => {
    const isComplete = grid.every((row) =>
      row.every(
        (cell) =>
          cell.isBlack || (cell.letter && cell.letter === cell.answer)
      )
    );

    if (isComplete && onComplete) {
      successScale.value = withSequence(
        withSpring(1.1),
        withSpring(1)
      );
      onComplete();
    }
  }, [grid]);

  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  // Check current word
  const checkWord = () => {
    if (!selectedCell) return;
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    const { startRow, startCol, answer } = currentWord;
    let isCorrect = true;

    for (let i = 0; i < answer.length; i++) {
      const row = direction === 'across' ? startRow : startRow + i;
      const col = direction === 'across' ? startCol + i : startCol;
      if (grid[row][col].letter !== answer[i]) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      Alert.alert('Correct! 🎉', 'You got this word right!');
    } else {
      shakeValue.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(-10),
        withSpring(10),
        withSpring(0)
      );
      Alert.alert('Not quite', 'Keep trying!');
    }
  };

  // Reveal current word
  const revealWord = () => {
    if (!selectedCell) return;
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    const { startRow, startCol, answer } = currentWord;
    const newGrid = [...grid];

    for (let i = 0; i < answer.length; i++) {
      const row = direction === 'across' ? startRow : startRow + i;
      const col = direction === 'across' ? startCol + i : startCol;
      newGrid[row][col] = { ...newGrid[row][col], letter: answer[i] };
    }

    setGrid(newGrid);
  };

  // Provide hint for current cell
  const giveHint = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const correctLetter = grid[row][col].answer;

    if (correctLetter) {
      const newGrid = [...grid];
      newGrid[row][col] = { ...newGrid[row][col], letter: correctLetter };
      setGrid(newGrid);
      moveToNextCell();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.gridContainer, shakeStyle, successStyle]}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isSelected =
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
              const isInWord = isCellInCurrentWord(rowIndex, colIndex);
              const isCorrect = cell.letter && cell.letter === cell.answer;
              const isWrong = cell.letter && cell.letter !== cell.answer;

              return (
                <Pressable
                  key={colIndex}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    cell.isBlack && styles.blackCell,
                    isSelected && styles.selectedCell,
                    isInWord && !isSelected && styles.highlightedCell,
                    isCorrect && styles.correctCell,
                    isWrong && styles.wrongCell,
                  ]}
                >
                  {cell.number && (
                    <Text style={styles.cellNumber}>{cell.number}</Text>
                  )}
                  {!cell.isBlack && (
                    <Text style={styles.cellLetter}>{cell.letter || ''}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>

      {/* Hidden input for keyboard */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        autoCapitalize="characters"
        maxLength={1}
        onChangeText={handleLetterInput}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === 'Backspace') {
            handleBackspace();
          }
        }}
        value=""
      />

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={checkWord}>
          <Text style={styles.controlButtonText}>Check Word</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={giveHint}>
          <Text style={styles.controlButtonText}>Hint</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={revealWord}>
          <Text style={styles.controlButtonText}>Reveal</Text>
        </Pressable>
      </View>

      {/* Current clue */}
      {getCurrentWord() && (
        <View style={styles.clueContainer}>
          <Text style={styles.clueNumber}>
            {getCurrentWord()!.number} {direction.toUpperCase()}
          </Text>
          <Text style={styles.clueText}>{getCurrentWord()!.clue}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  gridContainer: {
    padding: 2,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  blackCell: {
    backgroundColor: '#000',
  },
  selectedCell: {
    backgroundColor: '#FFE066',
  },
  highlightedCell: {
    backgroundColor: '#FFF4CC',
  },
  correctCell: {
    backgroundColor: '#D4EDDA',
  },
  wrongCell: {
    backgroundColor: '#F8D7DA',
  },
  cellNumber: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  cellLetter: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textTransform: 'uppercase',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clueContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    width: '100%',
  },
  clueNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  clueText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});

export default CrosswordGrid;
