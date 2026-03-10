import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';

export default function ProntuarioMedicoScreen() {
  return (
    <View style={styles.container}>
      <HealthHeader title="Atendimento Clínico" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* RESUMO DA TRIAGEM (DADOS DA ENFERMEIRA) */}
        <View style={styles.triageCard}>
          <Text style={styles.sectionTitle}>Resumo da Triagem (Enfermagem)</Text>
          <View style={styles.triageGrid}>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>PA:</Text><Text style={styles.triageValue}>12/8</Text></View>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>Temp:</Text><Text style={styles.triageValue}>36.5°C</Text></View>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>SPO2:</Text><Text style={styles.triageValue}>98%</Text></View>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>Peso:</Text><Text style={styles.triageValue}>75kg</Text></View>
          </View>
          <Text style={styles.complaint}>Queixa: Dor de cabeça constante e sensibilidade à luz.</Text>
        </View>

        {/* EVOLUÇÃO MÉDICA */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Anamnese e Evolução</Text>
          <TextInput 
            style={styles.textArea} 
            placeholder="Descreva a conduta clínica..." 
            multiline 
            numberOfLines={10} 
          />
          
          <Text style={styles.label}>Prescrição / Conduta</Text>
          <TextInput style={styles.input} placeholder="Medicamentos ou exames" />

          <TouchableOpacity style={styles.btnFinish}>
            <Text style={styles.btnText}>FINALIZAR ATENDIMENTO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botão de Libras para abrir o Tradutor Python */}
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  scroll: { padding: 15 },
  triageCard: { backgroundColor: '#E3F2FD', padding: 15, borderRadius: 12, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#2196F3' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1976D2', marginBottom: 10 },
  triageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  triageItem: { width: '48%', flexDirection: 'row', marginBottom: 5 },
  triageLabel: { fontWeight: 'bold', color: '#555', marginRight: 5 },
  triageValue: { color: '#333' },
  complaint: { marginTop: 10, fontStyle: 'italic', color: '#666', fontSize: 13 },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  textArea: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  btnFinish: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});