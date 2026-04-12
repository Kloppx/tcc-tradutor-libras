import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import Toast from 'react-native-toast-message';
import { RootStackScreenProps } from '../types/navigation';

type Props = RootStackScreenProps<'ProntuarioMedico'>;

export default function ProntuarioMedicoScreen({ route, navigation }: Props) {
  const { paciente } = route.params;
  const [anamnese, setAnamnese] = useState('');
  const [conduta, setConduta] = useState('');

  const triagem = paciente.triagem || {};

  const finalizarAtendimento = () => {
    Toast.show({
      type: 'success',
      text1: 'Atendimento finalizado',
      text2: `Prontuário de ${paciente.nome} atualizado com sucesso.`,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <HealthHeader title="Atendimento Clínico" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.patientHeader}>
          <Text style={styles.patientName}>{paciente.nome}</Text>
          <Text style={styles.patientMeta}>
            Senha: {paciente.senha || '--'} • Risco: {paciente.risco || '--'}
          </Text>
        </View>

        <View style={styles.triageCard}>
          <Text style={styles.sectionTitle}>Resumo da Triagem (Enfermagem)</Text>
          <View style={styles.triageGrid}>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>PA:</Text><Text style={styles.triageValue}>{triagem.pa || '--'}</Text></View>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>Temp:</Text><Text style={styles.triageValue}>{triagem.temp ? `${triagem.temp} C` : '--'}</Text></View>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>SpO2:</Text><Text style={styles.triageValue}>{triagem.spo2 ? `${triagem.spo2}%` : '--'}</Text></View>
            <View style={styles.triageItem}><Text style={styles.triageLabel}>Peso:</Text><Text style={styles.triageValue}>{triagem.peso ? `${triagem.peso} kg` : '--'}</Text></View>
          </View>
          <Text style={styles.complaint}>Queixa principal: {triagem.queixa || 'Não informada'}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Anamnese e Evolução</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Descreva a conduta clínica..."
            multiline
            numberOfLines={8}
            value={anamnese}
            onChangeText={setAnamnese}
          />

          <Text style={styles.label}>Prescrição / Conduta</Text>
          <TextInput
            style={styles.input}
            placeholder="Medicamentos, exames ou orientações"
            value={conduta}
            onChangeText={setConduta}
          />

          <TouchableOpacity style={styles.btnFinish} onPress={finalizarAtendimento}>
            <Text style={styles.btnText}>FINALIZAR ATENDIMENTO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  scroll: { padding: 15, paddingBottom: 90 },
  patientHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  patientName: { fontSize: 19, fontWeight: 'bold', color: '#1C3A59' },
  patientMeta: { marginTop: 4, color: '#5A7896', fontSize: 14 },
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
  btnText: { color: '#fff', fontWeight: 'bold' },
});
