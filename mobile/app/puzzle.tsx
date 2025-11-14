import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import CrosswordGrid from '../src/components/CrosswordGrid';
import ClueList from '../src/components/ClueList';
import { usePuzzleStore } from '../src/store/usePuzzleStore';
import { useAuthStore } from '../src/store/useAuthStore';

interface Word {
  number: number;
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
}

export default function PuzzleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showClues, setShowClues] = useState(false);
  const [activeClue, setActiveClue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Sample puzzle data - in production this would come from the store
  const [puzzle, setPuzzle] = useState<{
    id: string;
    size: number;
    words: Word[];
    title: string;
    difficulty: number;
  }>({
    id: 'sample-1',
    size: 7,
    title: 'Sample Puzzle',
    difficulty: 3,
    words: [
      {
        number: 1,
        clue: 'Opposite of day',
        answer: 'NIGHT',
        startRow: 0,
        startCol: 0,
        direction: 'across',
      },
      {
        number: 2,
        clue: 'Large body of water',
        answer: 'OCEAN',
        startRow: 2,
        startCol: 0,
        direction: 'across',
      },
      {
        number: 3,
        clue: 'Hot beverage',
        answer: 'COFFEE',
        startRow: 4,
        startCol: 0,
        direction: 'across',
      },
      {
        number: 4,
        clue: 'Flying mammal',
        answer: 'BAT',
        startRow: 6,
        startCol: 2,
        direction: 'across',
      },
      {
        number: 1,
        clue: 'Not old',
        answer: 'NEW',
        startRow: 0,
        startCol: 0,
        direction: 'down',
      },
      {
        number: 5,
        clue: 'Frozen water',
        answer: 'ICE',
        startRow: 0,
        startCol: 2,
        direction: 'down',
      },
      {
        number: 6,
        clue: 'Citrus fruit',
        answer: 'ORANGE',
        startRow: 0,
        startCol: 4,
        direction: 'down',
      },
      {
        number: 7,
        clue: 'Feline animal',
        answer: 'CAT',
        startRow: 2,
        startCol: 3,
        direction: 'down',
      },
    ],
  });

  useEffect(() => {
    loadPuzzleData();
  }, []);

  const loadPuzzleData = async () => {
    try {
      setLoading(true);
      // TODO: Load puzzle from store or API
      // For now, using sample data
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load puzzle:', error);
      Alert.alert('Error', 'Failed to load puzzle');
      setLoading(false);
    }
  };

  const handlePuzzleComplete = () => {
    Alert.alert(
      '🎉 Congratulations!',
      'You completed the puzzle!',
      [
        {
          text: 'New Puzzle',
          onPress: () => {
            // Load new puzzle
            loadPuzzleData();
          },
        },
        {
          text: 'Back to Home',
          onPress: () => router.push('/'),
        },
      ]
    );

    // TODO: Save completion to database
    console.log('[Puzzle] Completed puzzle:', puzzle.id);
  };

  const handleCluePress = (word: Word) => {
    setActiveClue(word.number);
    // TODO: Navigate to that word in the grid
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading puzzle...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{puzzle.title}</Text>
            <Text style={styles.subtitle}>
              Difficulty: {'⭐'.repeat(puzzle.difficulty)}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowClues(!showClues)}
            style={styles.cluesToggle}
          >
            <Text style={styles.cluesToggleText}>
              {showClues ? '✕' : 'Clues'}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {showClues ? (
          <ClueList
            words={puzzle.words}
            activeClue={activeClue}
            onCluePress={handleCluePress}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.gridScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <CrosswordGrid
              size={puzzle.size}
              words={puzzle.words}
              onComplete={handlePuzzleComplete}
            />
          </ScrollView>
        )}
      </View>

      {/* Stats Footer */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Words</Text>
          <Text style={styles.statValue}>{puzzle.words.length}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Size</Text>
          <Text style={styles.statValue}>{puzzle.size}×{puzzle.size}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>0%</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cluesToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cluesToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  gridScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
});
