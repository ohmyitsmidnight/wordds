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
import { useWordsStore } from '../src/store/useWordsStore';
import { generatePuzzleForApp } from '../src/utils/crosswordExamples';
import { WordInput } from '../src/utils/crosswordGenerator';

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
  const { words, fetchWords } = useWordsStore();
  const [showClues, setShowClues] = useState(false);
  const [activeClue, setActiveClue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [puzzle, setPuzzle] = useState<{
    id: string;
    size: number;
    words: Word[];
    title: string;
    difficulty: number;
  } | null>(null);

  useEffect(() => {
    loadPuzzleData();
  }, []);

  const loadPuzzleData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's words if not already loaded
      if (words.length === 0) {
        console.log('[Puzzle] Fetching user words...');
        await fetchWords();
      }

      // Check if user has any words
      if (words.length === 0) {
        setLoading(false);
        Alert.alert(
          'No Words Yet',
          'Add some words to your vocabulary list first to generate puzzles!',
          [
            { text: 'Add Words', onPress: () => router.push('/words') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Filter words based on difficulty
      let filteredWords = [...words];
      
      if (difficulty === 'easy') {
        // Easy: Only words with mastery level >= 2 (somewhat familiar)
        filteredWords = words.filter(w => w.mastery_level >= 2);
      } else if (difficulty === 'medium') {
        // Medium: Mix of learning words (mastery 0-3)
        filteredWords = words.filter(w => w.mastery_level <= 3);
      } else {
        // Hard: Include all words, especially challenging ones
        filteredWords = words.filter(w => w.mastery_level <= 2);
      }

      // If not enough words after filtering, use all words
      if (filteredWords.length < 5) {
        console.log('[Puzzle] Not enough filtered words, using all words');
        filteredWords = [...words];
      }

      // Convert user words to WordInput format for generator
      const vocabularyWords: WordInput[] = filteredWords.map(word => ({
        word: word.word.toUpperCase().replace(/[^A-Z]/g, ''), // Remove special chars
        clue: word.fetched_definition || word.definition || word.custom_definition || `Define: ${word.word}`,
      })).filter(w => w.word.length >= 3 && w.word.length <= 15); // Filter valid words

      if (vocabularyWords.length < 5) {
        Alert.alert(
          'Need More Words',
          `You need at least 5 words to generate a puzzle. You have ${vocabularyWords.length} valid words. Add more words to your vocabulary!`,
          [
            { text: 'Add Words', onPress: () => router.push('/words') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setLoading(false);
        return;
      }

      console.log(`[Puzzle] Generating ${difficulty} crossword from ${vocabularyWords.length} words...`);
      
      // Determine max words based on difficulty
      const maxWords = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 10 : 15;
      
      // Generate puzzle using the algorithm
      const generatedPuzzle = generatePuzzleForApp(vocabularyWords, {
        difficulty,
        maxWords,
      });

      if (generatedPuzzle) {
        console.log('[Puzzle] Successfully generated puzzle with', generatedPuzzle.words.length, 'words');
        setPuzzle({
          id: `generated-${Date.now()}`,
          size: generatedPuzzle.size,
          title: 'Vocabulary Practice',
          difficulty: 3,
          words: generatedPuzzle.words,
        });
      } else {
        console.error('[Puzzle] Failed to generate puzzle');
        Alert.alert('Error', 'Failed to generate puzzle. Please try again.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[Puzzle] Failed to load puzzle:', error);
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
          <Text style={styles.loadingText}>Generating puzzle from your words...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show message if no puzzle generated
  if (!puzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No Puzzle Available</Text>
          <Text style={styles.emptyText}>
            Add some words to your vocabulary list to start generating puzzles!
          </Text>
          <Pressable onPress={() => router.push('/words')} style={styles.emptyButton}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.emptyButtonGradient}>
              <Text style={styles.emptyButtonText}>Go to Words</Text>
            </LinearGradient>
          </Pressable>
        </View>
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
            <View style={styles.difficultySelector}>
              <Pressable 
                onPress={() => { setDifficulty('easy'); loadPuzzleData(); }}
                style={[styles.difficultyButton, difficulty === 'easy' && styles.difficultyButtonActive]}
              >
                <Text style={[styles.difficultyButtonText, difficulty === 'easy' && styles.difficultyButtonTextActive]}>
                  Easy
                </Text>
              </Pressable>
              <Pressable 
                onPress={() => { setDifficulty('medium'); loadPuzzleData(); }}
                style={[styles.difficultyButton, difficulty === 'medium' && styles.difficultyButtonActive]}
              >
                <Text style={[styles.difficultyButtonText, difficulty === 'medium' && styles.difficultyButtonTextActive]}>
                  Medium
                </Text>
              </Pressable>
              <Pressable 
                onPress={() => { setDifficulty('hard'); loadPuzzleData(); }}
                style={[styles.difficultyButton, difficulty === 'hard' && styles.difficultyButtonActive]}
              >
                <Text style={[styles.difficultyButtonText, difficulty === 'hard' && styles.difficultyButtonTextActive]}>
                  Hard
                </Text>
              </Pressable>
            </View>
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
        <Pressable onPress={loadPuzzleData} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 New Puzzle</Text>
        </Pressable>
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
    marginBottom: 8,
  },
  difficultySelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  difficultyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  difficultyButtonActive: {
    backgroundColor: '#fff',
  },
  difficultyButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyButtonTextActive: {
    color: '#667eea',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
