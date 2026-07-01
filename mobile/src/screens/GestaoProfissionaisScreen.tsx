import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { RootStackScreenProps } from '../types/navigation';
import { deleteProfessional, listProfessionals, BackendUser } from '../services/api';

type Props = RootStackScreenProps<'GestaoProfissionais'>;

export default function GestaoProfissionaisScreen({ navigation }: Props) {
  const [professionals, setProfessionals] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfessionals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listProfessionals();
      setProfessionals(response.professionals);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao carregar profissionais',
        text2: error instanceof Error ? error.message : 'Não foi possível buscar a lista.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfessionals();
  }, [loadProfessionals]);

  const handleDelete = (professional: BackendUser) => {
    Alert.alert('Excluir profissional', `Deseja remover ${professional.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProfessional(professional.id);
            Toast.show({ type: 'success', text1: 'Profissional removido' });
            loadProfessionals();
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Falha ao excluir',
              text2: error instanceof Error ? error.message : 'Não foi possível excluir o profissional.',
            });
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F6FA" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back-outline" size={26} color="#1C3A59" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestão de Profissionais</Text>
        <TouchableOpacity onPress={loadProfessionals} accessibilityLabel="Atualizar lista">
          <Ionicons name="refresh-outline" size={24} color="#1C3A59" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.sectionTitle}>Equipe Cadastrada ({professionals.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ProfissionalSignup')}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Novo cadastro</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={professionals}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadProfessionals} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={42} color="#8AA0B4" />
            <Text style={styles.emptyTitle}>Nenhum profissional cadastrado</Text>
            <Text style={styles.emptyText}>Use o botão "Novo cadastro" para criar o primeiro acesso.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.role} • {item.email}</Text>
              <Text style={styles.metaSecondary}>{item.councilNumber ? `Conselho: ${item.councilNumber}` : 'Conselho não informado'}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton} accessibilityLabel={`Excluir ${item.name}`}>
              <Ionicons name="trash-outline" size={20} color="#E53935" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6FA' },
  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EBF2',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C3A59' },
  actionRow: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  addButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3EBF2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1C3A59' },
  meta: { marginTop: 4, color: '#4D6A85', fontSize: 13 },
  metaSecondary: { marginTop: 2, color: '#6E879E', fontSize: 12 },
  deleteButton: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
  },
  emptyState: {
    marginTop: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3EBF2',
  },
  emptyTitle: { marginTop: 10, fontWeight: '700', color: '#2C3E50', fontSize: 16 },
  emptyText: { marginTop: 6, color: '#607D97', textAlign: 'center' },
});
