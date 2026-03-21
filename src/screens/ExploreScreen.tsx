import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ExploreScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="compass-outline" size={64} color="#DDD" />
        <Text style={styles.title}>Em breve</Text>
        <Text style={styles.subtitle}>
          Explore viajantes e rolês por mapa e filtros avançados.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
  },
  subtitle: {
    fontSize: 15,
    color: '#BBB',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ExploreScreen;

