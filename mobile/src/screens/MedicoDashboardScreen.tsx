import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { PacienteTriagem, RootStackScreenProps } from '../types/navigation';
import { listPatients } from '../services/api';

type Props = RootStackScreenProps<'MedicoDashboard'>;

const PACIENTES_TRIADOS: PacienteTriagem[] = [];

const RISK_PRIORITY: Record<NonNullable<PacienteTriagem['risco']>, number> = {
  Vermelho: 1,
  Amarelo: 2,
  Verde: 3,
};

export default function MedicoDashboardScreen({ navigation }: Props) {
  const [pacientes, setPacientes] = useState<PacienteTriagem[]>(PACIENTES_TRIADOS);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await listPatients('triaged');
        if (response.patients.length > 0) {
          setPacientes(response.patients as PacienteTriagem[]);
        }
      } catch {
        setPacientes(PACIENTES_TRIADOS);
      }
    };

    loadPatients();
  }, [pacientes]);

  const pacientesOrdenados = useMemo(() => {
    return [...pacientes].sort((a, b) => {
      const prioridadeA = RISK_PRIORITY[a.risco || 'Verde'];
      const prioridadeB = RISK_PRIORITY[b.risco || 'Verde'];
      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
      return (a.senha || '').localeCompare(b.senha || '');
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão no consultório?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        onPress: () => {
          Toast.show({ type: 'info', text1: 'Sessão encerrada', text2: 'Até logo, doutor!' });
          navigation.replace('Login');
        },
        style: 'destructive',
      },
    ]);
  };

  const handleCallNext = () => {
    const proximo = pacientesOrdenados[0];
    if (!proximo) {
      Toast.show({ type: 'info', text1: 'Fila vazia', text2: 'Não há pacientes aguardando consulta.' });
      return;
    }

    Toast.show({
      type: 'success',
      text1: `Chamando: ${proximo.nome}`,
      text2: `Senha ${proximo.senha} • Prioridade ${proximo.risco}`,
    });
  };

  const renderItem = ({ item }: { item: PacienteTriagem }) => {
    const barColor =
      item.risco === 'Vermelho' ? '#E53935' : item.risco === 'Amarelo' ? '#FBC02D' : '#43A047';

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProntuarioMedico', { paciente: item })}>
        <View style={[styles.riscoBar, { backgroundColor: barColor }]} />
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.info}>
              Senha: {item.senha} • {item.especialidade} • Risco: {item.risco}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HealthHeader title="Consultório Médico" />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#ff5252" />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryTitle}>Aguardando Consulta</Text>
          <Text style={styles.summaryCount}>{pacientesOrdenados.length} pacientes na fila</Text>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={handleCallNext}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <Text style={styles.callBtnText}>PRÓXIMO</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pacientesOrdenados}
        keyExtractor={(item) => item.id || item.nome}
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
    borderBottomColor: '#eee',
  },
  logoutBtn: { padding: 5 },
  summary: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  summaryCount: { fontSize: 13, color: '#2196F3' },
  callBtn: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  callBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 11 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', elevation: 3 },
  riscoBar: { width: 8 },
  cardContent: { flex: 1, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nome: { fontSize: 16, fontWeight: 'bold', color: '#444' },
  info: { fontSize: 13, color: '#888', marginTop: 2 },
});
