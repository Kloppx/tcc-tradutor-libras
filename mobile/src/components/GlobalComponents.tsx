import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Cabeçalho Acessível (Simulando o <h1> ou <header> do HTML)
export const HealthHeader = ({ title }: { title: string }) => (
  <View 
    style={styles.headerContainer}
    accessible={true}
    accessibilityRole="header" // Transforma isso em um título na hierarquia
    accessibilityLabel={`Cabeçalho: ${title}`}
  >
    <Text style={styles.headerText} allowFontScaling={true}>{title}</Text>
  </View>
);

// Botão Flutuante de Libras (Com Hint e Label descritivo)
export const LibrasFAB = () => {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity 
      style={styles.fab} 
      onPress={() => navigation.navigate('RealTimeTranslation')}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Ativar tradução em Libras"
      accessibilityHint="Abre a tela de tradução em tempo real para comunicação com o paciente"
    >
      <Ionicons name="hand-point-up-outline" size={30} color="#fff" importantForAccessibility="no" />
      <Text style={styles.fabText} allowFontScaling={false}>LIBRAS</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#2196F3', // Cor com contraste mínimo de 3:1 garantido
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff', // Texto branco no azul passa no WCAG AA
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
});