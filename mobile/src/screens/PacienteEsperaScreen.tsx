import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';

export default function PacienteEsperaScreen({ route, navigation }: any) {
  const nomePaciente = route.params?.pacienteNome || 'Paciente';
  const [senhaAleatoria] = useState(`N-${Math.floor(Math.random() * 100) + 10}`); // Ex: N-45
  const [dataHoraAtual, setDataHoraAtual] = useState('');
  const [isCalled, setIsCalled] = useState(false);
  const [piscar, setPiscar] = useState(true);

  // Relógio e Data
  useEffect(() => {
    const agora = new Date();
    setDataHoraAtual(agora.toLocaleString('pt-BR'));
  }, []);

  // Lógica do Botão Piscando quando chamado
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalled) {
      interval = setInterval(() => {
        setPiscar((prev) => !prev);
      }, 500); // Pisca a cada meio segundo
    } else {
      setPiscar(true); // Estático se não foi chamado
    }
    return () => clearInterval(interval);
  }, [isCalled]);

  // Simulação: Após 5 segundos, o paciente é chamado
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCalled(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HealthHeader title="Aguarde sua vez" />
        <TouchableOpacity onPress={() => navigation.navigate('Recepcao')}>
          <Ionicons name="home-outline" size={26} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.greeting}>Olá, {nomePaciente.split(' ')[0]}!</Text>
        <Text style={styles.subText}>Seu cadastro foi realizado em:</Text>
        <Text style={styles.dateText}>{dataHoraAtual}</Text>

        <View style={styles.ticketCard}>
          <Text style={styles.ticketLabel}>SUA SENHA</Text>
          <Text style={styles.ticketNumber}>{senhaAleatoria}</Text>
          <Text style={styles.ticketFooter}>Aguarde o chamado no painel ou no aplicativo.</Text>
        </View>

        {/* BOTÃO QUE PISCA */}
        <View style={[
          styles.statusBox, 
          isCalled ? (piscar ? styles.bgCalled : styles.bgCalledDim) : styles.bgWaiting
        ]}>
          <Ionicons 
            name={isCalled ? "alert-circle" : "time-outline"} 
            size={40} 
            color="#fff" 
          />
          <Text style={styles.statusText}>
            {isCalled ? "DIRIJA-SE À TRIAGEM!" : "AGUARDANDO CHAMADA..."}
          </Text>
        </View>
      </View>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  content: { flex: 1, padding: 25, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subText: { fontSize: 14, color: '#666', marginTop: 10 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#2196F3', marginTop: 5 },
  ticketCard: { backgroundColor: '#fff', width: '100%', padding: 40, borderRadius: 20, alignItems: 'center', marginTop: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 },
  ticketLabel: { fontSize: 16, color: '#888', fontWeight: 'bold', letterSpacing: 2 },
  ticketNumber: { fontSize: 60, fontWeight: 'bold', color: '#333', marginVertical: 10 },
  ticketFooter: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  statusBox: { width: '100%', padding: 25, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, elevation: 3 },
  bgWaiting: { backgroundColor: '#ff9800' }, // Laranja
  bgCalled: { backgroundColor: '#4CAF50' }, // Verde forte (piscando)
  bgCalledDim: { backgroundColor: '#a5d6a7' }, // Verde fraco (piscando)
  statusText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 }
});