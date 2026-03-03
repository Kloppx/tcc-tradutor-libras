import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// --- CABEÇALHO COM DATA E HORA EM TEMPO REAL ---
export const HealthHeader = ({ title }: { title: string }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDate.toLocaleDateString('pt-BR');
  const formattedTime = currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.dateTimeText}>{formattedDate} - {formattedTime}</Text>
      </View>
      <Ionicons name="medical-outline" size={28} color="#2196F3" />
    </View>
  );
};

// --- BOTÃO FLUTUANTE DA MÃOZINHA (LIBRAS) ---
export const LibrasFAB = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity 
      style={styles.fab} 
      onPress={() => navigation.navigate('RealTimeTranslation')}
      activeOpacity={0.7}
    >
      <Ionicons name="hand-right" size={30} color="#fff" />
      <Text style={styles.fabText}>Libras</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  dateTimeText: { fontSize: 14, color: '#666', fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#2196F3',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  fabText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: -2 }
});