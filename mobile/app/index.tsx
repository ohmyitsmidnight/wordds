import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // Redirect to login if not authenticated (after loading)
    if (!loading && !user) {
      // For now, allow access without login for testing
      // Uncomment below to enforce authentication:
      // router.replace('/login');
    }
  }, [loading, user]);

  const features = [
    {
      icon: '📚',
      title: 'My Words',
      description: 'Manage your vocabulary list',
      route: '/words',
      color: ['#667eea', '#764ba2'],
    },
    {
      icon: '🧩',
      title: 'Practice Puzzle',
      description: 'Solve crosswords with your words',
      route: '/puzzle',
      color: ['#f093fb', '#f5576c'],
    },
    {
      icon: '📊',
      title: 'Dashboard',
      description: 'Track your learning progress',
      route: '/dashboard',
      color: ['#4facfe', '#00f2fe'],
    },
    {
      icon: '⚙️',
      title: 'Settings',
      description: 'Preferences and account',
      route: '/settings',
      color: ['#43e97b', '#38f9d7'],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {user ? `Hello, ${user.display_name || 'there'}!` : 'Welcome!'}
          </Text>
          <Text style={styles.tagline}>Ready to learn?</Text>
        </View>
        {!user && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Puzzles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(feature.route as any)}
              style={styles.featureCardWrapper}
            >
              <LinearGradient
                colors={feature.color}
                style={styles.featureCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/words')}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.quickActionIcon}>➕</Text>
            <Text style={styles.quickActionText}>Add Your First Word</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#667eea',
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  featureCardWrapper: {
    width: '47%',
  },
  featureCard: {
    padding: 24,
    borderRadius: 20,
    minHeight: 160,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIcon: {
    fontSize: 48,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  quickActionButton: {
    marginBottom: 40,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
