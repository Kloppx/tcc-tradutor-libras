import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import VideoTranslationScreen from './src/screens/VideoTranslationScreen';
import Toast from 'react-native-toast-message';

export default function App() {
  const [showTranslator, setShowTranslator] = useState(true);

  if (showTranslator) {
    return (
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <VideoTranslationScreen />
          <TouchableOpacity
            style={styles.floatingSwitchBtn}
            onPress={() => setShowTranslator(false)}
          >
            <Text style={styles.floatingSwitchText}>Menu do Hospital ➔</Text>
          </TouchableOpacity>
        </View>
        <Toast />
      </NavigationContainer>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      <TouchableOpacity
        style={styles.floatingSwitchBtn}
        onPress={() => setShowTranslator(true)}
      >
        <Text style={styles.floatingSwitchText}>🎥 Abrir Tradutor de Libras</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingSwitchBtn: {
    position: 'absolute',
    top: 55,
    right: 16,
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 10,
    zIndex: 9999,
  },
  floatingSwitchText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
