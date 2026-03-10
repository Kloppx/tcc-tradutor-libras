import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const PACIENTES_TRIADOS = [
  { id: '1', nome: 'João da Silva', senha: 'H-01', risco: 'Verde', especialidade: 'Clínico Geral' },
  { id: '2', nome: 'Maria Oliveira', senha: 'H-02', risco: 'Amarelo', especialidade: 'Clínico Geral' },
  { id: '3', nome: 'José Santos', senha: 'H-03', risco: 'Vermelho', especialidade: 'Urgência' },
];

export default function MedicoDashboardScreen({ navigation }: any) {

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja encerrar a sessão no Consultório?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => {
          Toast.show({ type: 'info', text1: 'Sessão encerrada', text2: 'Até logo, doutor!' });
          navigation.replace('Login'); 
      }, style: "destructive" }
    ]);
  };

  const handleCallNext = () => {
    Toast.show({
      type: 'success',
      text1: `Chamando: ${PACIENTES_TRIADOS[0].nome}`,
      text2: `Senha ${PACIENTES_TRIADOS[0].senha} - Favor comparecer.`,
    });
  };

  const renderItem = ({ item }: { item: typeof PACIENTES_TRIADOS[0] }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ProntuarioMedico', { paciente: item })}
    >
      <View style={[styles.riscoBar, { backgroundColor: item.risco === 'Vermelho' ? '#ff5252' : item.risco === 'Amarelo' ? '#ffd740' : '#4caf50' }]} />
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.info}>Senha: {item.senha} • {item.especialidade}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER ROW COM ALINHAMENTO PERFEITO */}
      <View style={styles.headerRow}>
        <HealthHeader title="Consultório Médico" />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#ff5252" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryTitle}>Aguardando Consulta</Text>
          <Text style={styles.summaryCount}>{PACIENTES_TRIADOS.length} pacientes na fila</Text>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={handleCallNext}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <Text style={styles.callBtnText}>PRÓXIMO</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={PACIENTES_TRIADOS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
      />
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 50, 
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  logoutBtn: { padding: 5 },
  summary: { 
    padding: 20, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  summaryCount: { fontSize: 13, color: '#2196F3' },
  callBtn: { 
    backgroundColor: '#2196F3', 
    flexDirection: 'row', 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    elevation: 2
  },
  callBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', elevation: 3 },
  riscoBar: { width: 8 },
  cardContent: { flex: 1, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nome: { fontSize: 16, fontWeight: 'bold', color: '#444' },
  info: { fontSize: 13, color: '#888', marginTop: 2 }
});