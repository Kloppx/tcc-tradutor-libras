import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Simulando dados que viriam de um banco (BI Style)
const PACIENTES_FILA = [
  { id: '1', nome: 'João Silva', urgencia: 'Alta', region: 'Tronco', sintomas: ['Dor no peito', 'Falta de ar'] },
  { id: '2', nome: 'Maria Oliveira', urgencia: 'Média', region: 'Cabeça', sintomas: ['Tontura'] },
  { id: '3', nome: 'Paciente Atual (Você)', urgencia: 'Baixa', region: 'Braço', sintomas: ['Inchaço'] },
];

export default function ProfissionalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderPaciente = ({ item }: { item: typeof PACIENTES_FILA[0] }) => (
    <View style={styles.card}>
      <View style={[styles.urgencyBar, { backgroundColor: item.urgencia === 'Alta' ? '#F44336' : '#FFC107' }]} />
      
      <View style={styles.cardContent}>
        <Text style={styles.pacienteNome}>{item.nome}</Text>
        <Text style={styles.pacienteInfo}><Text style={{fontWeight:'bold'}}>Região:</Text> {item.region}</Text>
        <Text style={styles.pacienteInfo}><Text style={{fontWeight:'bold'}}>Sintomas:</Text> {item.sintomas.join(', ')}</Text>
      </View>

      {/* BOTÃO PARA INICIAR TRADUÇÃO DE LIBRAS */}
      <TouchableOpacity 
        style={styles.btnLibras}
        onPress={() => navigation.navigate('RealTimeTranslation')}
      >
        <Ionicons name="hand-right" size={24} color="#fff" />
        <Text style={styles.btnText}>Traduzir</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Painel Médico</Text>
          <Text style={styles.subtitle}>Fila de Atendimento - UBS</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={PACIENTES_FILA}
        keyExtractor={(item) => item.id}
        renderItem={renderPaciente}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { padding: 30, paddingTop: 60, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#2196F3', fontWeight: 'bold' },
  logoutBtn: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 10 },
  
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', elevation: 3 },
  urgencyBar: { width: 8 },
  cardContent: { flex: 1, padding: 15 },
  pacienteNome: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  pacienteInfo: { fontSize: 14, color: '#666' },
  
  btnLibras: { backgroundColor: '#2196F3', width: 90, justifyContent: 'center', alignItems: 'center', padding: 10 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: 5 }
});