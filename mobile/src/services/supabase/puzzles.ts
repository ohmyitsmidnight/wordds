import { supabase } from './client';
import { Puzzle, PuzzleAttempt, PuzzleConfig } from '@types/index';

export class PuzzlesService {
  /**
   * Generate a new puzzle via Edge Function
   */
  async generatePuzzle(userId: string, config: PuzzleConfig) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-puzzle', {
        body: {
          user_id: userId,
          difficulty: config.difficulty,
          grid_size: config.grid_size,
          user_words_count: config.user_words_count,
          include_reverse_clues: config.include_reverse_clues,
        },
      });

      if (error) throw error;
      return data.puzzle as Puzzle;
    } catch (error) {
      console.error('Generate puzzle error:', error);
      throw error;
    }
  }

  /**
   * Get a specific puzzle
   */
  async getPuzzle(puzzleId: number) {
    try {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .eq('id', puzzleId)
        .single();

      if (error) throw error;
      return data as Puzzle;
    } catch (error) {
      console.error('Get puzzle error:', error);
      throw error;
    }
  }

  /**
   * Get user's puzzles
   */
  async getUserPuzzles(userId: string, status?: string) {
    try {
      let query = supabase
        .from('puzzles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Puzzle[];
    } catch (error) {
      console.error('Get user puzzles error:', error);
      throw error;
    }
  }

  /**
   * Start a new puzzle attempt
   */
  async startAttempt(userId: string, puzzleId: number) {
    try {
      const { data, error } = await supabase
        .from('puzzle_attempts')
        .insert({
          puzzle_id: puzzleId,
          user_id: userId,
          current_grid: {},
          completed: false,
          hints_used: 0,
          checks_used: 0,
          reveals_used: 0,
          correct_words: 0,
          incorrect_words: 0,
          accuracy_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PuzzleAttempt;
    } catch (error) {
      console.error('Start attempt error:', error);
      throw error;
    }
  }

  /**
   * Update puzzle attempt progress
   */
  async updateAttempt(attemptId: number, updates: Partial<PuzzleAttempt>) {
    try {
      const { data, error } = await supabase
        .from('puzzle_attempts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return data as PuzzleAttempt;
    } catch (error) {
      console.error('Update attempt error:', error);
      throw error;
    }
  }

  /**
   * Check answer(s) via Edge Function
   */
  async checkAnswer(
    puzzleId: number,
    attemptId: number,
    scope: 'square' | 'word' | 'puzzle',
    position?: { row?: number; col?: number; clueNumber?: number; direction?: string }
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('check-answer', {
        body: {
          puzzle_id: puzzleId,
          attempt_id: attemptId,
          scope,
          ...position,
        },
      });

      if (error) throw error;

      // Update checks used count
      await supabase.rpc('increment_checks_used', { attempt_id: attemptId });

      return data;
    } catch (error) {
      console.error('Check answer error:', error);
      throw error;
    }
  }

  /**
   * Request hint via Edge Function
   */
  async requestHint(
    puzzleId: number,
    attemptId: number,
    clueNumber: number,
    direction: 'across' | 'down'
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-hint', {
        body: {
          puzzle_id: puzzleId,
          attempt_id: attemptId,
          clue_number: clueNumber,
          direction,
        },
      });

      if (error) throw error;

      // Update hints used count
      await supabase.rpc('increment_hints_used', { attempt_id: attemptId });

      return data.hint;
    } catch (error) {
      console.error('Request hint error:', error);
      throw error;
    }
  }

  /**
   * Reveal answer(s)
   */
  async revealAnswer(
    puzzleId: number,
    attemptId: number,
    scope: 'square' | 'word' | 'puzzle',
    position?: { row?: number; col?: number; clueNumber?: number; direction?: string }
  ) {
    try {
      // Get puzzle to retrieve answers
      const puzzle = await this.getPuzzle(puzzleId);
      
      // Update reveals used count
      await supabase.rpc('increment_reveals_used', { attempt_id: attemptId });

      return { puzzle, scope, position };
    } catch (error) {
      console.error('Reveal answer error:', error);
      throw error;
    }
  }

  /**
   * Complete puzzle attempt
   */
  async completePuzzle(attemptId: number) {
    try {
      const endTime = new Date().toISOString();

      // Get attempt to calculate stats
      const { data: attempt } = await supabase
        .from('puzzle_attempts')
        .select('*, puzzles(*)')
        .eq('id', attemptId)
        .single();

      if (!attempt) throw new Error('Attempt not found');

      const startTime = new Date(attempt.start_time);
      const totalTimeSeconds = Math.floor(
        (new Date(endTime).getTime() - startTime.getTime()) / 1000
      );

      // Update attempt
      const { data, error } = await supabase
        .from('puzzle_attempts')
        .update({
          completed: true,
          end_time: endTime,
          total_time_seconds: totalTimeSeconds,
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;

      // Update puzzle status
      await supabase
        .from('puzzles')
        .update({ status: 'completed' })
        .eq('id', attempt.puzzle_id);

      // Trigger learning progress update via Edge Function
      await supabase.functions.invoke('update-learning-progress', {
        body: {
          user_id: attempt.user_id,
          puzzle_id: attempt.puzzle_id,
          attempt_id: attemptId,
        },
      });

      return data as PuzzleAttempt;
    } catch (error) {
      console.error('Complete puzzle error:', error);
      throw error;
    }
  }
}

export const puzzlesService = new PuzzlesService();
