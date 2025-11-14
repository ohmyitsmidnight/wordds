import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useWordsStore } from '../src/store/useWordsStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { Word } from '../src/types';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  Layout,
} from 'react-native-reanimated';

interface WordItemProps {
  word: Word;
  onPress: () => void;
  onDelete: () => void;
  onToggleMastery: () => void;
}

const WordItem: React.FC<WordItemProps> = ({ word, onPress, onDelete, onToggleMastery }) => {
  const isMastered = word.status === 'mastered';
  
  // Priority: custom_definition > fetched_definition > definition (legacy)
  let definition = word.custom_definition || word.fetched_definition || word.definition || 'Loading definition...';
  let definitionStatus = null;
  
  // Show status indicator for fetched definitions
  if (!word.custom_definition) {
    if (word.fetch_status === 'pending') {
      definition = '⏳ Fetching definition...';
    } else if (word.fetch_status === 'failed' || word.fetch_status === 'not_found') {
      definition = '❌ Definition not found. Tap to add custom definition.';
    }
  }

  return (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      layout={Layout.springify()}
    >
      <Pressable onPress={onPress} style={styles.wordCard}>
        <View style={styles.wordCardContent}>
          <View style={styles.wordHeader}>
            <Text style={styles.wordText}>{word.word}</Text>
            <View style={styles.wordMeta}>
              <View style={[styles.statusBadge, isMastered && styles.masteredBadge]}>
                <Text style={[styles.statusText, isMastered && styles.masteredText]}>
                  {isMastered ? '✓ Mastered' : 'Learning'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.definitionText} numberOfLines={2}>
            {definition}
          </Text>
          <View style={styles.wordActions}>
            <Pressable onPress={onToggleMastery} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                {isMastered ? '↻ Unmark' : '✓ Mark Mastered'}
              </Text>
            </Pressable>
            <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑 Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function WordsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { words, loading, fetchWords, addWord, updateWord, deleteWord } = useWordsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');

  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user]);

  const loadWords = async () => {
    try {
      await fetchWords();
    } catch (error) {
      console.error('[Words] Failed to load words:', error);
      Alert.alert('Error', 'Failed to load words');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) {
      Alert.alert('Error', 'Please enter a word');
      return;
    }

    try {
      if (editingWord) {
        // Update existing word
        await updateWord(editingWord.id, {
          word: newWord.trim(),
          custom_definition: customNotes.trim() || undefined,
        });
        Alert.alert('Success', 'Word updated!');
      } else {
        // Add new word - definition will be fetched automatically
        await addWord({
          word: newWord.trim(),
          custom_definition: customNotes.trim() || undefined,
          status: 'learning',
          mastery_level: 0,
          source: 'manual',
        });
        Alert.alert('Success', 'Word added! Definition is being fetched...');
      }

      // Reset form
      setNewWord('');
      setNewDefinition('');
      setCustomNotes('');
      setEditingWord(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('[Words] Failed to save word:', error);
      Alert.alert('Error', 'Failed to save word');
    }
  };

  const handleEditWord = (word: any) => {
    setEditingWord(word);
    setNewWord(word.word);
    setNewDefinition(word.fetched_definition || word.definition || '');
    setCustomNotes(word.custom_definition || '');
    setShowAddModal(true);
  };

  const handleDeleteWord = (wordId: number, wordText: string) => {
    Alert.alert(
      'Delete Word',
      `Are you sure you want to delete "${wordText}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWord(wordId);
              Alert.alert('Success', 'Word deleted');
            } catch (error) {
              console.error('[Words] Failed to delete word:', error);
              Alert.alert('Error', 'Failed to delete word');
            }
          },
        },
      ]
    );
  };

  const handleToggleMastery = async (word: any) => {
    try {
      const newStatus = word.status === 'mastered' ? 'learning' : 'mastered';
      await updateWord(word.id, {
        status: newStatus,
        mastery_level: newStatus === 'mastered' ? 5 : word.mastery_level,
      });
    } catch (error) {
      console.error('[Words] Failed to update status:', error);
      Alert.alert('Error', 'Failed to update word status');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingWord(null);
    setNewWord('');
    setNewDefinition('');
    setCustomNotes('');
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      Alert.alert('Error', 'Please paste some words');
      return;
    }

    // Parse bulk text - expecting format: "word: definition" per line
    const lines = bulkImportText.split('\n').filter(line => line.trim());
    const wordsToImport: Array<{ word: string; definition: string }> = [];

    for (const line of lines) {
      // Support formats: "word: definition" or "word - definition"
      const match = line.match(/^(.+?)[\s]*[:-][\s]*(.+)$/);
      if (match) {
        const [, word, definition] = match;
        wordsToImport.push({
          word: word.trim(),
          definition: definition.trim(),
        });
      }
    }

    if (wordsToImport.length === 0) {
      Alert.alert(
        'Invalid Format',
        'Please use format:\nword: definition\n\nExample:\nSerendipity: Finding something good without looking for it'
      );
      return;
    }

    try {
      let successCount = 0;
      for (const wordData of wordsToImport) {
        try {
          await addWord({
            word: wordData.word,
            definition: wordData.definition,
            status: 'learning',
            mastery_level: 0,
            source: 'file_upload',
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to import word: ${wordData.word}`, error);
        }
      }

      setBulkImportText('');
      setShowBulkImportModal(false);
      Alert.alert(
        'Import Complete',
        `Successfully imported ${successCount} of ${wordsToImport.length} words`
      );
    } catch (error) {
      console.error('[Words] Bulk import failed:', error);
      Alert.alert('Error', 'Failed to import words');
    }
  };

  // Filter words based on search query
  const filteredWords = words.filter(
    (word) =>
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (word.definition || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (word.custom_definition || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort words: learning first, then mastered, alphabetically within each
  const sortedWords = [...filteredWords].sort((a, b) => {
    if (a.status === b.status) {
      return a.word.localeCompare(b.word);
    }
    return a.status === 'learning' ? -1 : 1;
  });

  const learningCount = words.filter((w) => w.status === 'learning').length;
  const masteredCount = words.filter((w) => w.status === 'mastered').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>My Words</Text>
            <Text style={styles.subtitle}>
              {learningCount} learning · {masteredCount} mastered
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search words or definitions..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* Words List */}
      {sortedWords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No words found' : 'No words yet'}
          </Text>
          <Text style={styles.emptyDescription}>
            {searchQuery
              ? 'Try a different search term'
              : 'Add your first vocabulary word to start learning!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedWords}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <WordItem
              word={item}
              onPress={() => handleEditWord(item)}
              onDelete={() => handleDeleteWord(item.id, item.word)}
              onToggleMastery={() => handleToggleMastery(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Add Button */}
      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => setShowBulkImportModal(true)}
        >
          <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.fabGradient}>
            <Text style={styles.fabText}>📋 Import</Text>
          </LinearGradient>
        </Pressable>
        
        <Pressable
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
        >
          <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.fabGradient}>
            <Text style={styles.fabText}>+ Add Word</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingWord ? 'Edit Word' : 'Add New Word'}
              </Text>
              <Pressable onPress={handleCloseModal}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView 
              style={styles.formScrollView}
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Word *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Serendipity"
                  value={newWord}
                  onChangeText={setNewWord}
                  autoCapitalize="words"
                  returnKeyType="done"
                  autoFocus
                />
              </View>

              {!editingWord && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>💡 Definition will be automatically fetched from the dictionary</Text>
                </View>
              )}

              {editingWord && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Custom Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add your own notes, examples, or mnemonics..."
                    value={customNotes}
                    onChangeText={setCustomNotes}
                    multiline
                    numberOfLines={3}
                    returnKeyType="done"
                  />
                </View>
              )}

              <Pressable style={styles.submitButton} onPress={handleAddWord}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {editingWord ? 'Update Word' : 'Add Word'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        visible={showBulkImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBulkImportModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowBulkImportModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Import Words</Text>
              <Pressable onPress={() => setShowBulkImportModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.formScrollView}
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.importHint}>
                <Text style={styles.importHintText}>
                  Paste your words in this format (one per line):
                </Text>
                <Text style={styles.importExample}>
                  Serendipity: Finding something good without looking for it{'\n'}
                  Ephemeral: Lasting for a very short time{'\n'}
                  Resilient: Able to recover quickly
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Paste Words Below</Text>
                <TextInput
                  style={[styles.input, styles.bulkTextArea]}
                  placeholder="word: definition&#10;word: definition&#10;..."
                  value={bulkImportText}
                  onChangeText={setBulkImportText}
                  multiline
                  numberOfLines={10}
                  returnKeyType="done"
                />
              </View>

              <Pressable style={styles.submitButton} onPress={handleBulkImport}>
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitButtonText}>Import Words</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    color: '#fff',
    fontSize: 18,
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordCardContent: {
    padding: 16,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masteredBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  masteredText: {
    color: '#065F46',
  },
  definitionText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 12,
  },
  wordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    gap: 12,
  },
  fab: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    transform: [{ scale: 0.85 }],
  },
  fabGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  formScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  infoText: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  importHint: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  importHintText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
    fontWeight: '600',
  },
  importExample: {
    fontSize: 13,
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
  bulkTextArea: {
    minHeight: 200,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
