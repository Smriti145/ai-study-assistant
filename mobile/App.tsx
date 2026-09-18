import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { loadConnection } from './src/api';
import {
  ConnectionScreen,
  FlashcardsScreen,
  ProgressScreen,
  SolverScreen,
} from './src/screens';

export default function App() {
  const [tab, setTab] = useState('Solver'),
    [ready, setReady] = useState(false),
    [connection, setConnection] = useState(0);
  useEffect(() => {
    loadConnection()
      .catch(() => setTab('Connection'))
      .finally(() => setReady(true));
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.brand}>
          <Text style={styles.brandText}>Studyspace</Text>
          <Text style={styles.caption}>A little progress, every day.</Text>
        </View>
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {!ready ? (
            <ActivityIndicator accessibilityLabel="Loading workspace" />
          ) : (
            <View
              key={tab === 'Connection' ? 'connection' : connection}
              style={styles.body}
            >
              {tab === 'Solver' ? (
                <SolverScreen />
              ) : tab === 'Cards' ? (
                <FlashcardsScreen />
              ) : tab === 'Progress' ? (
                <ProgressScreen />
              ) : (
                <ConnectionScreen onSave={() => setConnection(x => x + 1)} />
              )}
            </View>
          )}
          <View accessibilityRole="tablist" style={styles.tabs}>
            {['Solver', 'Cards', 'Progress', 'Connection'].map(name => (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityLabel={name}
                accessibilityState={{ selected: name === tab }}
                onPress={() => setTab(name)}
                style={[styles.tab, name === tab && styles.selected]}
              >
                <Text style={styles.tabText}>{name}</Text>
              </Pressable>
            ))}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5ee' },
  body: { flex: 1 },
  brand: { padding: 20, borderBottomWidth: 1, borderColor: '#d5e1d4' },
  brandText: { fontSize: 24, fontWeight: '700', color: '#193d35' },
  caption: { color: '#63786c', marginTop: 3 },
  tabs: {
    flexDirection: 'row',
    padding: 8,
    gap: 4,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#d5e1d4',
  },
  tab: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  selected: { backgroundColor: '#cee4d4' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#205e4b' },
});
