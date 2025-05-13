// app/layout.tsx
import { Slot } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function Layout() {
  return (
    <SafeAreaView style={styles.container}>
      <Slot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
