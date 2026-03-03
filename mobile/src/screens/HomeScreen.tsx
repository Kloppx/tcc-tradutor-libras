import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <HealthHeader title="Meu Atendimento" />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Olá, bem-vindo ao</Text>
          <Text style={styles.appName}>INTERPRETARTE</Text>
        </View>

        {/* CARD DE STATUS: O QUE O PACIENTE REALMENTE PRECISA VER */}
        <TouchableOpacity 
          style={styles.statusCard}
          onPress={() => navigation.navigate('Recepcao')}
        >
          <View style={styles.statusIcon}>
            <Ionicons name="qr-code-outline" size={30} color="#fff" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Check-in / Senha</Text>
            <Text style={styles.statusDesc}>Clique aqui para gerar sua senha de atendimento.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.miniCard} 
            onPress={() => navigation.navigate('UBS')}
          >
            <Ionicons name="map-outline" size={24} color="#2196F3" />
            <Text style={styles.miniCardText}>UBS Maceió</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.miniCard}
            onPress={() => navigation.navigate('Sobre')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#2196F3" />
            <Text style={styles.miniCardText}>Como funciona</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Dica de Saúde</Text>
          <Text style={styles.infoText}>
            Mantenha seu cartão do SUS e CPF sempre em mãos para agilizar o atendimento na triagem.
          </Text>
        </View>
      </ScrollView>

      {/* Acessibilidade sempre presente */}
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  scroll: { padding: 20 },
  welcomeCard: { marginBottom: 30, marginTop: 10 },
  welcomeText: { fontSize: 18, color: '#666' },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#2196F3' },
  statusCard: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 15, 
    elevation: 3,
    marginBottom: 20
  },
  statusIcon: { backgroundColor: '#2196F3', padding: 12, borderRadius: 12 },
  statusInfo: { flex: 1, marginLeft: 15 },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusDesc: { fontSize: 13, color: '#888', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  miniCard: { 
    backgroundColor: '#fff', 
    width: '48%', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center',
    elevation: 2 
  },
  miniCardText: { marginTop: 10, fontWeight: 'bold', color: '#444' },
  infoBox: { marginTop: 30, padding: 20, backgroundColor: '#E3F2FD', borderRadius: 15 },
  infoTitle: { fontWeight: 'bold', color: '#1976D2', marginBottom: 5 },
  infoText: { color: '#555', lineHeight: 20 }
});