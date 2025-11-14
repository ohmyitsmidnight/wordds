import { create } from 'zustand';
import { PuzzleState, Puzzle, PuzzleAttempt } from '../types';
import { puzzlesService } from '../services/supabase/puzzles';

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  currentPuzzle: null,
  currentAttempt: null,
  userAnswers: {},
  selectedClue: null,
  loading: false,

  generatePuzzle: async (config) => {
    const userId = get().getUserId();
    if (!userId) return;

    try {
      set({ loading: true });
      const puzzle = await puzzlesService.generatePuzzle(userId, config);
      set({ currentPuzzle: puzzle, loading: false });
    } catch (error) {
      console.error('Generate puzzle error:', error);
      set({ loading: false });
      throw error;
    }
  },

  startAttempt: async (puzzleId) => {
    const userId = get().getUserId();
    if (!userId) return;

    try {
      set({ loading: true });
      const attempt = await puzzlesService.startAttempt(userId, puzzleId);
      set({
        currentAttempt: attempt,
        userAnswers: attempt.current_grid,
        loading: false,
      });
    } catch (error) {
      console.error('Start attempt error:', error);
      set({ loading: false });
      throw error;
    }
  },

  updateAnswer: (clueKey, answer) => {
    set((state) => {
      const newAnswers = { ...state.userAnswers, [clueKey]: answer };
      
      // Auto-save to backend
      if (state.currentAttempt) {
        puzzlesService.updateAttempt(state.currentAttempt.id, {
          current_grid: newAnswers,
        });
      }

      return { userAnswers: newAnswers };
    });
  },

  checkAnswer: async (scope) => {
    const { currentPuzzle, currentAttempt, selectedClue } = get();
    if (!currentPuzzle || !currentAttempt) return false;

    try {
      const position =
        scope === 'word' && selectedClue
          ? {
              clueNumber: selectedClue.number,
              direction: selectedClue.direction,
            }
          : undefined;

      const result = await puzzlesService.checkAnswer(
        currentPuzzle.id,
        currentAttempt.id,
        scope,
        position
      );

      return result.correct;
    } catch (error) {
      console.error('Check answer error:', error);
      return false;
    }
  },

  requestHint: async () => {
    const { currentPuzzle, currentAttempt, selectedClue } = get();
    if (!currentPuzzle || !currentAttempt || !selectedClue) return '';

    try {
      const hint = await puzzlesService.requestHint(
        currentPuzzle.id,
        currentAttempt.id,
        selectedClue.number,
        selectedClue.direction
      );

      return hint;
    } catch (error) {
      console.error('Request hint error:', error);
      return '';
    }
  },

  revealAnswer: async (scope) => {
    const { currentPuzzle, currentAttempt, selectedClue } = get();
    if (!currentPuzzle || !currentAttempt) return;

    try {
      const position =
        scope === 'word' && selectedClue
          ? {
              clueNumber: selectedClue.number,
              direction: selectedClue.direction,
            }
          : undefined;

      const result = await puzzlesService.revealAnswer(
        currentPuzzle.id,
        currentAttempt.id,
        scope,
        position
      );

      // Update user answers with revealed data
      // Implementation depends on reveal logic
    } catch (error) {
      console.error('Reveal answer error:', error);
    }
  },

  completePuzzle: async () => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;

    try {
      await puzzlesService.completePuzzle(currentAttempt.id);
      set({
        currentPuzzle: null,
        currentAttempt: null,
        userAnswers: {},
        selectedClue: null,
      });
    } catch (error) {
      console.error('Complete puzzle error:', error);
      throw error;
    }
  },

  // Helper to get current user ID
  getUserId: () => {
    // This would come from auth store
    return '';
  },
}));
