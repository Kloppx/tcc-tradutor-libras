import React from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Switch, TouchableOpacity } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';

export default function ProcedimentosEnfermagemScreen() {
  const [procedimentoRealizado, setProcedimentoRealizado] = React.useState(false);

  return (
    <View style={styles.container}>
      <HealthHeader title="Procedimentos e Programas" />
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        
        {/* SEÇÃO DE PROGRAMAS ESPECÍFICOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Programas de Saúde</Text>
          {['Viva Leite', 'Pré-Natal', 'Bolsa Família', 'Lian Gong'].map((prog) => (
            <View key={prog} style={styles.row}>
              <Text>{prog}</Text>
              <Switch value={false} onValueChange={() => {}} />
            </View>
          ))}
          <TextInput style={styles.input} placeholder="Nome da Enfermeira Responsável" />
        </View>

        {/* SEÇÃO DE PROCEDIMENTOS TÉCNICOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Procedimentos Realizados</Text>
          {['ECG', 'Coleta de Sangue', 'Vacina + Teste Pezinho', 'Curativo', 'Notificação Dengue'].map((proc) => (
            <View key={proc} style={styles.itemProc}>
              <Text style={styles.procLabel}>{proc}</Text>
              <TextInput 
                style={styles.textArea} 
                multiline 
                placeholder={`Observações sobre ${proc}...`} 
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btnSalvar}>
          <Text style={styles.btnText}>Registrar no Prontuário</Text>
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  input: { borderBottomWidth: 1, borderColor: '#ddd', marginTop: 15, padding: 5 },
  itemProc: { marginBottom: 15 },
  procLabel: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  textArea: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, height: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee' },
  btnSalvar: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});