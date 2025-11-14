import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface Word {
  number: number;
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
}

interface ClueListProps {
  words: Word[];
  activeClue: number | null;
  onCluePress: (word: Word) => void;
}

const ClueList: React.FC<ClueListProps> = ({ words, activeClue, onCluePress }) => {
  const acrossWords = words.filter((w) => w.direction === 'across');
  const downWords = words.filter((w) => w.direction === 'down');

  const renderClue = (word: Word) => {
    const isActive = activeClue === word.number;

    return (
      <Pressable
        key={word.number}
        onPress={() => onCluePress(word)}
        style={[styles.clueItem, isActive && styles.activeClue]}
      >
        <Text style={[styles.clueNumber, isActive && styles.activeClueText]}>
          {word.number}.
        </Text>
        <Text style={[styles.clueText, isActive && styles.activeClueText]}>
          {word.clue}
          {isActive && (
            <Text style={styles.answerLength}> ({word.answer.length})</Text>
          )}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {acrossWords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACROSS</Text>
          {acrossWords.map(renderClue)}
        </View>
      )}

      {downWords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOWN</Text>
          {downWords.map(renderClue)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  clueItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  activeClue: {
    backgroundColor: '#007AFF',
  },
  clueNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    minWidth: 30,
  },
  clueText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  activeClueText: {
    color: '#fff',
    fontWeight: '600',
  },
  answerLength: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
});

export default ClueList;
