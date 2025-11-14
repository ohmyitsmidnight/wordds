import { supabase } from './client';
import { Word, WordFilters } from '@types/index';

// Free Dictionary API response types
interface DictionaryDefinition {
  definition: string;
  example?: string;
}

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

interface DictionaryResponse {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
}

export class WordsService {
  /**
   * Fetch definition from Free Dictionary API
   */
  private async fetchDefinitionFromAPI(word: string): Promise<{
    definition: string;
    partOfSpeech?: string;
    phonetic?: string;
    example?: string;
  } | null> {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );

      if (!response.ok) {
        return null;
      }

      const data: DictionaryResponse[] = await response.json();
      
      if (!data || data.length === 0 || !data[0].meanings || data[0].meanings.length === 0) {
        return null;
      }

      const firstMeaning = data[0].meanings[0];
      const firstDefinition = firstMeaning.definitions[0];

      return {
        definition: firstDefinition.definition,
        partOfSpeech: firstMeaning.partOfSpeech,
        phonetic: data[0].phonetic,
        example: firstDefinition.example,
      };
    } catch (error) {
      console.error('Free Dictionary API error:', error);
      return null;
    }
  }
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
   * Add a new word with automatic definition lookup
   */
  async addWord(userId: string, wordData: Partial<Word>) {
    try {
      const wordText = wordData.word?.trim();
      if (!wordText) {
        throw new Error('Word is required');
      }

      // Fetch definition from Free Dictionary API
      const apiResult = await this.fetchDefinitionFromAPI(wordText);
      
      let fetchStatus: 'success' | 'not_found' | 'failed' = 'not_found';
      let fetchedDefinition: string | null = null;
      let fetchError: string | null = null;

      if (apiResult) {
        fetchStatus = 'success';
        fetchedDefinition = apiResult.definition;
        if (apiResult.example) {
          fetchedDefinition += `\n\nExample: ${apiResult.example}`;
        }
      } else {
        fetchError = 'Definition not found in Free Dictionary API';
      }

      // Insert word with fetched definition
      const { data, error } = await supabase
        .from('words')
        .insert({
          user_id: userId,
          word: wordText,
          fetched_definition: fetchedDefinition,
          definition_source: 'free_dictionary_api',
          fetch_status: fetchStatus,
          fetch_error: fetchError,
          fetched_at: new Date().toISOString(),
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
   * Bulk import words with automatic definition lookup
   */
  async bulkImport(userId: string, words: string[], source: string) {
    try {
      // Process words in parallel with definition lookup
      const wordPromises = words.map(async (word) => {
        const wordText = word.trim();
        const apiResult = await this.fetchDefinitionFromAPI(wordText);
        
        let fetchStatus: 'success' | 'not_found' | 'failed' = 'not_found';
        let fetchedDefinition: string | null = null;
        let fetchError: string | null = null;

        if (apiResult) {
          fetchStatus = 'success';
          fetchedDefinition = apiResult.definition;
          if (apiResult.example) {
            fetchedDefinition += `\n\nExample: ${apiResult.example}`;
          }
        } else {
          fetchError = 'Definition not found in Free Dictionary API';
        }

        return {
          user_id: userId,
          word: wordText,
          fetched_definition: fetchedDefinition,
          definition_source: 'free_dictionary_api',
          fetch_status: fetchStatus,
          fetch_error: fetchError,
          fetched_at: new Date().toISOString(),
          source,
          status: 'learning' as const,
          mastery_level: 0,
        };
      });

      const wordsToInsert = await Promise.all(wordPromises);

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
