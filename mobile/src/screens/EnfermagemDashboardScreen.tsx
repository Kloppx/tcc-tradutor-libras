import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, StatusBar } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { PacienteTriagem, RootStackScreenProps } from '../types/navigation';
import { LibrasFAB } from '../components/GlobalComponents';
import { listPatients, deletePatient } from '../services/api';

const DADOS_FILA: PacienteTriagem[] = [];

const STATUS_LABELS: Record<string, { label: string; backgroundColor: string; textColor: string }> = {
  waiting: { label: 'Aguardando triagem', backgroundColor: '#E8F4FD', textColor: '#1976D2' },
  triaged: { label: 'Triado', backgroundColor: '#E8F8F1', textColor: '#1E8449' },
  called: { label: 'Chamado', backgroundColor: '#FFF3E0', textColor: '#EF6C00' },
  done: { label: 'Atendido', backgroundColor: '#F3E5F5', textColor: '#7B1FA2' },
};

const formatArrivalTime = (createdAt?: string) => {
  if (!createdAt) return '--';

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) return '--';

  return parsedDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

type Props = RootStackScreenProps<'EnfermagemDashboard'>;

export default function EnfermagemDashboardScreen({ navigation }: Props) {
  const [pacientes, setPacientes] = useState<PacienteTriagem[]>(DADOS_FILA);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      const [waitingResponse, triagedResponse] = await Promise.all([
        listPatients('waiting'),
        listPatients('triaged'),
      ]);

      const combinedPatients = [...waitingResponse.patients, ...triagedResponse.patients] as PacienteTriagem[];
      combinedPatients.sort((a, b) => {
        const statusOrder = (status?: string) => (status === 'waiting' ? 0 : 1);
        const orderDiff = statusOrder(a.status) - statusOrder(b.status);
        if (orderDiff !== 0) return orderDiff;

        const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return updatedB - updatedA;
      });

      setPacientes(combinedPatients);
    } catch {
      setPacientes(DADOS_FILA);
    }
  }, []);

  const summary = useMemo(() => {
    const waiting = pacientes.filter((patient) => patient.status === 'waiting').length;
    const triaged = pacientes.filter((patient) => patient.status === 'triaged').length;
    return { waiting, triaged };
  }, [pacientes]);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

  const handleLogout = () => {
    Alert.alert(
      "Encerrar Sessão", 
      "Tem certeza que deseja sair do painel de enfermagem?", 
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: () => {
            Toast.show({ type: 'info', text1: 'Sessão encerrada com segurança.' });
            navigation.replace('Login'); 
        }, style: "destructive" }
      ]
    );
  };

  const handleDeletePatient = (item: PacienteTriagem) => {
    if (!item.id) {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível excluir',
        text2: 'Paciente sem identificação válida.',
      });
      return;
    }

    Alert.alert(
      'Excluir paciente',
      `Deseja remover ${item.nome} da fila e do banco?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(item.id || null);
              await deletePatient(item.id as string);
              Toast.show({ type: 'success', text1: 'Paciente excluído com sucesso.' });
              await loadPatients();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erro ao excluir paciente',
                text2: error instanceof Error ? error.message : 'Não foi possível concluir a exclusão.',
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PacienteTriagem }) => (
    <View style={styles.patientCard}>
      <TouchableOpacity
        style={styles.patientPrimaryAction}
        onPress={item.status === 'waiting' ? () => navigation.navigate('TriagemAvancada', { paciente: item }) : undefined}
        disabled={item.status !== 'waiting'}
        accessible={true}
        accessibilityLabel={`Paciente ${item.nome}, ${item.idade} anos. ${item.status === 'waiting' ? 'Toque para iniciar triagem.' : 'Triagem já concluída.'}`}
      >
        <View style={styles.patientIcon}>
          <Ionicons name="person-outline" size={30} color={item.status === 'waiting' ? '#3498DB' : '#1E8449'} />
        </View>
        <View style={styles.patientInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.patientName}>{item.nome}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_LABELS[item.status || 'waiting'].backgroundColor }]}>
              <Text style={[styles.statusBadgeText, { color: STATUS_LABELS[item.status || 'waiting'].textColor }]}>
                {STATUS_LABELS[item.status || 'waiting'].label}
              </Text>
            </View>
          </View>
          <Text style={styles.patientDetails}>
            {item.idade ?? '--'} anos • Senha: {item.senha ?? '--'} • Chegada: {formatArrivalTime(item.createdAt)}
          </Text>
        </View>
        <Ionicons name={item.status === 'waiting' ? 'chevron-forward-outline' : 'checkmark-circle-outline'} size={24} color={item.status === 'waiting' ? '#BDC3C7' : '#1E8449'} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, deletingId === item.id && styles.deleteButtonDisabled]}
        onPress={() => handleDeletePatient(item)}
        disabled={deletingId === item.id}
        accessibilityLabel={`Excluir paciente ${item.nome}`}
      >
        <Ionicons name="trash-outline" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Painel de Enfermagem</Text>
          <Text style={styles.headerSubtitle}>Olá, equipe de enfermagem!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} accessibilityLabel="Sair da sua conta">
          <Ionicons name="log-out-outline" size={30} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.waiting}</Text>
          <Text style={styles.summaryLabel}>Aguardando</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.triaged}</Text>
          <Text style={styles.summaryLabel}>Triados</Text>
        </View>
      </View>

      {/* Seção da Lista de Pacientes (FlatList) */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Fila de Espera e Triagem Realizada</Text>
        <FlatList
          data={pacientes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item.nome}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F4F8' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 60, 
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEE'
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2C3E50' 
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 13,
    color: '#7F8C8D',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#34495E', 
    marginBottom: 15 
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  patientCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 10,
    flexDirection: 'row', 
    alignItems: 'center',
  },
  patientPrimaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  patientIcon: {
    marginRight: 15,
  },
  patientInfo: { 
    flex: 1 
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  patientName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#2C3E50' 
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  patientDetails: { 
    fontSize: 14, 
    color: '#7F8C8D',
    marginTop: 4,
  },
  separator: {
    height: 10,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    marginLeft: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
});