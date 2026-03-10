import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Dimensions } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit'; 
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get("window").width;

const FILA_RECEPCAO = [
  { id: '1', nome: 'Ana Paula Souza', idade: '22 anos', senha: 'S-45' },
  { id: '2', nome: 'Ricardo Alencar', idade: '45 anos', senha: 'S-46' },
  { id: '3', nome: 'Beatriz Lins', idade: '31 anos', senha: 'S-47' },
];

export default function EnfermagemDashboardScreen({ navigation }: any) {

  const handleLogout = () => {
    Alert.alert("Sair", "Encerrar sessão de Enfermagem?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => {
          Toast.show({ type: 'info', text1: 'Sessão encerrada', text2: 'Bom descanso!' });
          navigation.replace('Login'); 
      }, style: "destructive" }
    ]);
  };

  const renderPaciente = ({ item }: { item: typeof FILA_RECEPCAO[0] }) => (
    <View style={styles.patientCard}>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.nome}</Text>
        <Text style={styles.patientSub}>{item.idade} • Senha: {item.senha}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.miniBtn, { backgroundColor: '#4CAF50' }]} 
          onPress={() => navigation.navigate('TriagemAvancada')}
        >
          <Ionicons name="clipboard-outline" size={14} color="#fff" />
          <Text style={styles.miniBtnText}>TRIAGEM</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.miniBtn, { backgroundColor: '#2196F3' }]} 
          onPress={() => navigation.navigate('ProcedimentosEnfermagem')}
        >
          <Ionicons name="medkit-outline" size={14} color="#fff" />
          <Text style={styles.miniBtnText}>PROCED.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER ROW ALINHADO */}
      <View style={styles.headerRow}>
        <HealthHeader title="Painel de Enfermagem" />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#ff5252" />
        </TouchableOpacity>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Fluxo de Atendimentos (Hoje)</Text>
        <LineChart
          data={{
            labels: ["08h", "10h", "12h", "14h", "16h", "18h"],
            datasets: [{ data: [4, 15, 10, 25, 18, 12] }]
          }}
          width={screenWidth - 40}
          height={160}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, 
            labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#4CAF50" }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={styles.sectionTitle}>Aguardando Triagem</Text>
        <FlatList
          data={FILA_RECEPCAO}
          keyExtractor={(item) => item.id}
          renderItem={renderPaciente}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
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
  chartSection: { padding: 20, alignItems: 'center' },
  chart: { borderRadius: 16, elevation: 2, backgroundColor: '#fff', paddingVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  patientCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 10, 
    elevation: 2, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: 'bold', color: '#444' },
  patientSub: { fontSize: 12, color: '#888' },
  actionButtons: { gap: 6 },
  miniBtn: { 
    flexDirection: 'row', 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 6, 
    alignItems: 'center', 
    minWidth: 90,
    justifyContent: 'center'
  },
  miniBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }
});