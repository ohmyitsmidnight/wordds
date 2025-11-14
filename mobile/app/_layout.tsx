import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth in the background, don't block rendering
    initialize().catch((error) => {
      console.error('Failed to initialize auth:', error);
    });
  }, []);

  return <Slot />;
}
