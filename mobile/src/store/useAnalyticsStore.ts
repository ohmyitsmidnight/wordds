import { create } from 'zustand';
import { AnalyticsState, AnalyticsEvent } from '../types';
import { supabase } from '../services/supabase/client';

const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 30000; // 30 seconds

export const useAnalyticsStore = create<AnalyticsState>((set, get) => {
  // Auto-flush events periodically
  setInterval(() => {
    get().flush();
  }, FLUSH_INTERVAL);

  return {
    events: [],

    track: (eventName, category, properties) => {
      const userId = get().getUserId();
      const sessionId = get().getSessionId();

      const event: AnalyticsEvent = {
        user_id: userId || undefined,
        session_id: sessionId || undefined,
        event_name: eventName,
        event_category: category,
        properties: properties || {},
        timestamp: new Date().toISOString(),
      };

      set((state) => {
        const newEvents = [...state.events, event];
        
        // Auto-flush if batch size reached
        if (newEvents.length >= BATCH_SIZE) {
          setTimeout(() => get().flush(), 0);
        }

        return { events: newEvents };
      });
    },

    flush: async () => {
      const events = get().events;
      if (events.length === 0) return;

      try {
        // Clear events immediately to avoid duplicates
        set({ events: [] });

        // Send to Supabase
        const { error } = await supabase
          .from('analytics_events')
          .insert(events);

        if (error) {
          // Re-add events if failed
          set((state) => ({
            events: [...events, ...state.events],
          }));
          console.error('Flush analytics error:', error);
        }
      } catch (error) {
        // Re-add events if failed
        set((state) => ({
          events: [...events, ...state.events],
        }));
        console.error('Flush analytics error:', error);
      }
    },

    // Helpers
    getUserId: () => '',
    getSessionId: () => '',
  };
});
