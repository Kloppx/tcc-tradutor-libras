import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Switch, KeyboardAvoidingView, Platform 
} from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';

export default function ProntuarioMedicoScreen() {
  const [tabAtiva, setTabAtiva] = useState<'prontuario' | 'libras'>('prontuario');

  // Estados do Prontuário (Requisitos SOAP + Adicionais da Cliente)
  const [queixa, setQueixa] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [plano, setPlano] = useState('');
  const [prescricao, setPrescricao] = useState('');
  const [internacao, setInternacao] = useState(false);

  const renderTabButton = (id: 'prontuario' | 'libras', label: string, icon: any) => (
    <TouchableOpacity 
      style={[styles.tabBtn, tabAtiva === id && styles.tabBtnAtivo]} 
      onPress={() => setTabAtiva(id)}
    >
      <Ionicons name={icon} size={20} color={tabAtiva === id ? '#fff' : '#2196F3'} />
      <Text style={[styles.tabText, tabAtiva === id && styles.tabTextAtivo]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HealthHeader title="Atendimento Médico" />
      
      {/* SELETOR DE ABAS EXIGIDO PELA CLIENTE */}
      <View style={styles.tabContainer}>
        {renderTabButton('prontuario', 'Prontuário', 'document-text-outline')}
        {renderTabButton('libras', 'Comunicador', 'videocam-outline')}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {tabAtiva === 'prontuario' ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* RESUMO DA TRIAGEM (DADOS QUE VEM DA ENFERMAGEM) */}
            <View style={styles.triageSummary}>
              <Text style={styles.summaryTitle}>Resumo da Triagem</Text>
              <Text style={styles.summaryText}>PA: 12/8 mmHg | Peso: 80kg | Sat: 98% | IMC: 24.7</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Anamnese Médico (SOAP)</Text>
              
              <Text style={styles.label}>Subjetivo (Queixa do Paciente)</Text>
              <TextInput style={styles.textArea} multiline value={queixa} onChangeText={setQueixa} placeholder="Descreva a queixa..." />

              <Text style={styles.label}>Objetivo (Metas da Consulta)</Text>
              <TextInput style={styles.textArea} multiline value={objetivo} onChangeText={setObjetivo} />

              <Text style={styles.label}>Avaliação (Parecer Médico / CID)</Text>
              <TextInput style={styles.textArea} multiline value={avaliacao} onChangeText={setAvaliacao} />

              <Text style={styles.label}>Plano (Orientação e Tratamento)</Text>
              <TextInput style={styles.textArea} multiline value={plano} onChangeText={setPlano} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Prescrições e Condutas</Text>
              <TextInput style={styles.textArea} multiline value={prescricao} onChangeText={setPrescricao} placeholder="Medicamentos e dosagens..." />
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Solicitar Internação?</Text>
                <Switch value={internacao} onValueChange={setInternacao} />
              </View>
            </View>

            {/* IDENTIFICAÇÃO DO PROFISSIONAL (REQUISITO DA CLIENTE) */}
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>Médico: Dr. Usuário | CRM: 12345-AL</Text>
              <Text style={styles.footerText}>Unidade: UBS Benedito Bentes</Text>
            </View>

            <TouchableOpacity style={styles.btnFinalizar}>
              <Text style={styles.btnText}>Finalizar Atendimento</Text>
            </TouchableOpacity>
            
            <View style={{ height: 100 }} />
          </ScrollView>
        ) : (
          <View style={styles.librasContainer}>
            {/* ONDE ENTRARÁ A CÂMERA DO TRADUTOR QUE VOCÊ ESTÁ DESENVOLVENDO NO TCC */}
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="hand-right-outline" size={80} color="#2196F3" />
              <Text style={styles.cameraText}>Câmera de Tradução Libras Ativa</Text>
            </View>
            <Text style={styles.instrucao}>O médico pode alternar entre as abas sem perder os dados digitados.</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  tabContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff' },
  tabBtn: { flex: 1, flexDirection: 'row', padding: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  tabBtnAtivo: { backgroundColor: '#2196F3' },
  tabText: { marginLeft: 8, color: '#2196F3', fontWeight: 'bold' },
  tabTextAtivo: { color: '#fff' },
  scroll: { padding: 15 },
  triageSummary: { backgroundColor: '#e3f2fd', padding: 15, borderRadius: 10, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: '#2196F3' },
  summaryTitle: { fontWeight: 'bold', color: '#1976D2', marginBottom: 5 },
  summaryText: { fontSize: 13, color: '#444' },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2196F3', marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, marginTop: 10 },
  textArea: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, textAlignVertical: 'top', height: 80, borderWidth: 1, borderColor: '#eee' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  switchLabel: { fontWeight: 'bold', color: '#444' },
  footerInfo: { alignItems: 'center', marginVertical: 10 },
  footerText: { fontSize: 12, color: '#999' },
  btnFinalizar: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  librasContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  cameraPlaceholder: { width: '100%', height: 300, backgroundColor: '#eee', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc' },
  cameraText: { marginTop: 20, color: '#666', fontWeight: 'bold' },
  instrucao: { textAlign: 'center', marginTop: 20, color: '#888' }
});