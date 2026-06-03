import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit'; 
import Toast from 'react-native-toast-message';
import { PacienteTriagem, RootStackScreenProps } from '../types/navigation';
import { LibrasFAB } from '../components/GlobalComponents';
import { listPatients } from '../services/api';

const screenWidth = Dimensions.get("window").width;

// DADOS MOCKADOS PARA A FILA DE PACIENTES
const DADOS_FILA: PacienteTriagem[] = [
  {
    id: '1',
    nome: 'Ana Paula Souza',
    idade: 22,
    senha: 'N-45',
    risco: 'Verde',
    triagem: { pa: '118/76', temp: '36.4', spo2: '98', peso: '62', queixa: 'Dor de garganta' },
  },
  {
    id: '2',
    nome: 'Ricardo Alencar',
    idade: 45,
    senha: 'N-46',
    risco: 'Amarelo',
    triagem: { pa: '142/92', temp: '37.1', spo2: '96', peso: '84', queixa: 'Dor no peito leve' },
  },
  {
    id: '3',
    nome: 'Beatriz Lins',
    idade: 31,
    senha: 'N-47',
    risco: 'Verde',
    triagem: { pa: '120/80', temp: '36.8', spo2: '99', peso: '68', queixa: 'Cefaleia' },
  },
  {
    id: '4',
    nome: 'Carlos Andrade',
    idade: 56,
    senha: 'N-48',
    risco: 'Amarelo',
    triagem: { pa: '150/95', temp: '37.3', spo2: '95', peso: '90', queixa: 'Tontura' },
  },
];

// DADOS MOCKADOS PARA O GRÁFICO DE FLUXO
const DADOS_GRAFICO = {
  labels: ["08h", "10h", "12h", "14h", "16h", "18h"],
  datasets: [{ data: [4, 15, 10, 25, 18, 12] }]
};

const HORA_CHEGADA: Record<string, string> = {
  '1': '08:15',
  '2': '08:18',
  '3': '08:22',
  '4': '08:25',
};

type Props = RootStackScreenProps<'EnfermagemDashboard'>;

export default function EnfermagemDashboardScreen({ navigation }: Props) {
  const [pacientes, setPacientes] = useState<PacienteTriagem[]>(DADOS_FILA);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await listPatients('waiting');
        if (response.patients.length > 0) {
          setPacientes(response.patients as PacienteTriagem[]);
        }
      } catch {
        setPacientes(DADOS_FILA);
      }
    };

    loadPatients();
  }, []);

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

  const renderItem = ({ item }: { item: PacienteTriagem }) => (
    <TouchableOpacity 
      style={styles.patientCard}
      onPress={() => navigation.navigate('TriagemAvancada', { paciente: item })}
      accessible={true}
      accessibilityLabel={`Paciente ${item.nome}, ${item.idade} anos. Toque para iniciar triagem.`}
    >
      <View style={styles.patientIcon}>
        <Ionicons name="person-outline" size={30} color="#3498DB" />
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.nome}</Text>
        <Text style={styles.patientDetails}>
          {item.idade ?? '--'} anos • Senha: {item.senha ?? '--'} • Chegada: {HORA_CHEGADA[item.id || ''] ?? '--'}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={24} color="#BDC3C7" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Painel de Enfermagem</Text>
          <Text style={styles.headerSubtitle}>Olá, Enf. Márcia! 👋</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} accessibilityLabel="Sair da sua conta">
          <Ionicons name="log-out-outline" size={30} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      {/* Seção do Gráfico de BI */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Volume de Atendimentos por Hora</Text>
        <LineChart
          data={DADOS_GRAFICO}
          width={screenWidth - 40}
          height={180}
          yAxisLabel=""
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: "#F0F4F8",
            backgroundGradientFrom: "#F0F4F8",
            backgroundGradientTo: "#F0F4F8",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "5", strokeWidth: "2", stroke: "#3498DB" }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Seção da Lista de Pacientes (FlatList) */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Fila de Espera para Triagem</Text>
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
  chartContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEE',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#34495E', 
    marginBottom: 15 
  },
  chart: { 
    alignSelf: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  patientCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  patientIcon: {
    marginRight: 15,
  },
  patientInfo: { 
    flex: 1 
  },
  patientName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#2C3E50' 
  },
  patientDetails: { 
    fontSize: 14, 
    color: '#7F8C8D',
    marginTop: 4,
  },
  separator: {
    height: 10,
  },
});