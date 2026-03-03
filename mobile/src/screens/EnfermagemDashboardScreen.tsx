import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BarChart } from "react-native-chart-kit"; // BIBLIOTECA BÔNUS (+0,5)

const PACIENTES_FILA = [
  { id: '1', nome: 'João da Silva', senha: 'H-01', tempo: '5 min', status: 'Aguardando' },
  { id: '2', nome: 'Maria Oliveira', senha: 'H-02', tempo: '12 min', status: 'Aguardando' },
  { id: '3', nome: 'José Santos', senha: 'H-03', tempo: '15 min', status: 'Urgente' },
];

export default function EnfermagemDashboardScreen() {
  const navigation = useNavigation<any>();
  const screenWidth = Dimensions.get("window").width;

  // Configuração do Gráfico de BI (Fluxo por hora)
  const chartData = {
    labels: ["08h", "10h", "12h", "14h", "16h"],
    datasets: [{ data: [12, 19, 8, 25, 15] }]
  };

  const renderItem = ({ item }: { item: typeof PACIENTES_FILA[0] }) => (
    <View style={styles.pacienteCard}>
      <View style={styles.infoBox}>
        <View style={styles.senhaBadge}><Text style={styles.senhaText}>{item.senha}</Text></View>
        <View style={styles.detailsBox}>
          <Text style={styles.nomeText}>{item.nome}</Text>
          <Text style={styles.tempoText}>Espera: {item.tempo}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.btnBlue]} onPress={() => navigation.navigate('TriagemAvancada')}>
          <Text style={styles.btnText}>Triagem</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.btnGreen]} onPress={() => navigation.navigate('ProcedimentosEnfermagem')}>
          <Text style={styles.btnText}>Procedimento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <HealthHeader title="Painel de Enfermagem" />
      
      {/* SEÇÃO DE BI - GRÁFICO PROFISSIONAL */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Fluxo de Atendimento (Hoje)</Text>
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={160}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
          }}
          style={{ borderRadius: 15, marginTop: 10 }}
        />
      </View>

      <Text style={styles.sectionTitle}>Fila Atual - UBS Benedito Bentes</Text>
      <FlatList data={PACIENTES_FILA} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ padding: 15 }} />
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  chartCard: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 15, elevation: 3 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#444' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginLeft: 15 },
  pacienteCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, marginHorizontal: 15, elevation: 2 },
  infoBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  senhaBadge: { backgroundColor: '#E3F2FD', padding: 10, borderRadius: 8, marginRight: 15 },
  senhaText: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },
  detailsBox: { flex: 1 },
  nomeText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tempoText: { fontSize: 12, color: '#888' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnBlue: { backgroundColor: '#2196F3' },
  btnGreen: { backgroundColor: '#4CAF50' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});