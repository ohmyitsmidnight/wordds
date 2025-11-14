import { supabase } from './client';
import { Word, WordFilters } from '@types/index';

export class WordsService {
  /**
   * Fetch user's words with optional filters
   */
  async fetchWords(userId: string, filters?: WordFilters) {
    try {
      let query = supabase
        .from('words')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.ilike('word', `%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'added_at';
      const order = filters?.order || 'desc';
      query = query.order(sortBy, { ascending: order === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return data as Word[];
    } catch (error) {
      console.error('Fetch words error:', error);
      throw error;
    }
  }

  /**
   * Add a new word
   */
  async addWord(userId: string, wordData: Partial<Word>) {
    try {
      // First, try to get word definition from word_definitions table
      const { data: definition } = await supabase
        .from('word_definitions')
        .select('*')
        .eq('word_lower', wordData.word?.toLowerCase())
        .single();

      const { data, error } = await supabase
        .from('words')
        .insert({
          user_id: userId,
          word: wordData.word,
          definition: definition?.definition || wordData.custom_definition || '',
          custom_definition: wordData.custom_definition,
          source: wordData.source || 'manual',
          status: 'learning',
          mastery_level: 0,
          import_context: wordData.import_context,
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize learning progress for this word
      await this.initializeLearningProgress(userId, data.id);

      return data as Word;
    } catch (error) {
      console.error('Add word error:', error);
      throw error;
    }
  }

  /**
   * Bulk import words
   */
  async bulkImport(userId: string, words: string[], source: string) {
    try {
      const wordsToInsert = words.map((word) => ({
        user_id: userId,
        word: word.trim(),
        source,
        status: 'learning',
        mastery_level: 0,
      }));

      const { data, error } = await supabase
        .from('words')
        .insert(wordsToInsert)
        .select();

      if (error) throw error;

      // Initialize learning progress for all words
      if (data) {
        await Promise.all(
          data.map((word) => this.initializeLearningProgress(userId, word.id))
        );
      }

      return data as Word[];
    } catch (error) {
      console.error('Bulk import error:', error);
      throw error;
    }
  }

  /**
   * Update a word
   */
  async updateWord(wordId: number, updates: Partial<Word>) {
    try {
      const { data, error } = await supabase
        .from('words')
        .update(updates)
        .eq('id', wordId)
        .select()
        .single();

      if (error) throw error;
      return data as Word;
    } catch (error) {
      console.error('Update word error:', error);
      throw error;
    }
  }

  /**
   * Delete a word
   */
  async deleteWord(wordId: number) {
    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', wordId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete word error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to realtime changes for user's words
   */
  subscribeToWords(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('words-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'words',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }

  /**
   * Initialize learning progress for a new word
   */
  private async initializeLearningProgress(userId: string, wordId: number) {
    try {
      await supabase.from('learning_progress').insert({
        user_id: userId,
        word_id: wordId,
        easiness_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        next_review_at: new Date().toISOString(),
        correct_count: 0,
        incorrect_count: 0,
        total_exposures: 0,
        stage: 'new',
      });
    } catch (error) {
      console.error('Initialize learning progress error:', error);
      // Don't throw - this is not critical for word creation
    }
  }
}

export const wordsService = new WordsService();
