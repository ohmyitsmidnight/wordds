import { create } from 'zustand';
import { WordsState, Word, WordSource } from '../types';
import { wordsService } from '../services/supabase/words';
import { useAuthStore } from './useAuthStore';

export const useWordsStore = create<WordsState>((set, get) => ({
  words: [],
  loading: false,
  error: null,

  fetchWords: async (filters) => {
    const userId = get().getUserId();
    if (!userId) return;

    try {
      set({ loading: true, error: null });
      const words = await wordsService.fetchWords(userId, filters);
      set({ words, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addWord: async (wordData) => {
    const userId = get().getUserId();
    if (!userId) return;

    try {
      set({ loading: true, error: null });
      const newWord = await wordsService.addWord(userId, wordData);
      set((state) => ({
        words: [newWord, ...state.words],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteWord: async (id) => {
    try {
      set({ loading: true, error: null });
      await wordsService.deleteWord(id);
      set((state) => ({
        words: state.words.filter((w) => w.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateWord: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedWord = await wordsService.updateWord(id, updates);
      set((state) => ({
        words: state.words.map((w) => (w.id === id ? updatedWord : w)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  bulkImport: async (words, source) => {
    const userId = get().getUserId();
    if (!userId) return;

    try {
      set({ loading: true, error: null });
      const importedWords = await wordsService.bulkImport(userId, words, source);
      set((state) => ({
        words: [...importedWords, ...state.words],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Helper to get current user ID
  getUserId: () => {
    const user = useAuthStore.getState().user;
    return user?.id || null;
  },
}));
