import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Switch, KeyboardAvoidingView, Platform 
} from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';

export default function TriagemAvancadaScreen() {
  // --- ESTADOS DOS DADOS (REQUISITOS DA CLIENTE) ---
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [imc, setImc] = useState('--');
  
  // Sinais Vitais
  const [temp, setTemp] = useState('');
  const [pa, setPa] = useState('');
  const [pulso, setPulso] = useState('');
  const [sat, setSat] = useState('');
  const [glicemia, setGlicemia] = useState('');
  
  // Condições (Sim/Não)
  const [vacinaDia, setVacinaDia] = useState(false);
  const [has, setHas] = useState(false);
  const [dm, setDm] = useState(false);
  const [gravidez, setGravidez] = useState(false);
  const [sangramento, setSangramento] = useState(false);

  // --- LÓGICA DE CÁLCULO DE IMC AUTOMÁTICO ---
  useEffect(() => {
    if (peso && altura) {
      const p = parseFloat(peso.replace(',', '.'));
      const a = parseFloat(altura.replace(',', '.')) / 100; // converte cm para m
      if (p > 0 && a > 0) {
        const resultado = (p / (a * a)).toFixed(1);
        setImc(resultado);
      }
    } else {
      setImc('--');
    }
  }, [peso, altura]);

  const renderInput = (label: string, value: string, setter: (t: string) => void, unit: string, placeholder: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput 
          style={styles.input} 
          value={value} 
          onChangeText={setter} 
          placeholder={placeholder}
          keyboardType="numeric"
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );

  const renderSwitch = (label: string, value: boolean, setter: (v: boolean) => void) => (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch 
        value={value} 
        onValueChange={setter} 
        trackColor={{ false: "#ddd", true: "#bbdefb" }}
        thumbColor={value ? "#2196F3" : "#f4f3f4"}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <HealthHeader title="Triagem Clínica" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* SEÇÃO 1: BIOMETRIA & IMC */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Antropometria</Text>
            <View style={styles.row}>
              {renderInput("Peso", peso, setPeso, "kg", "00.0")}
              {renderInput("Altura", altura, setAltura, "cm", "000")}
            </View>
            <View style={styles.imcBox}>
              <Text style={styles.imcLabel}>IMC Calculado:</Text>
              <Text style={styles.imcValue}>{imc}</Text>
            </View>
          </View>

          {/* SEÇÃO 2: SINAIS VITAIS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sinais Vitais</Text>
            <View style={styles.row}>
              {renderInput("Temp.", temp, setTemp, "°C", "36.5")}
              {renderInput("P.A.", pa, setPa, "mmHg", "12/8")}
            </View>
            <View style={styles.row}>
              {renderInput("Pulso", pulso, setPulso, "bpm", "80")}
              {renderInput("Sat.", sat, setSat, "%", "98")}
            </View>
            {renderInput("Glicemia", glicemia, setGlicemia, "mg/dL", "90")}
          </View>

          {/* SEÇÃO 3: CONDIÇÕES E ALERTAS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Histórico e Condições</Text>
            {renderSwitch("Vacinas em dia?", vacinaDia, setVacinaDia)}
            {renderSwitch("Hipertensão (HAS)?", has, setHas)}
            {renderSwitch("Diabetes (DM)?", dm, setDm)}
            {renderSwitch("Gestante?", gravidez, setGravidez)}
            {renderSwitch("Sangramento Ativo?", sangramento, setSangramento)}
          </View>

          <TouchableOpacity style={styles.btnSalvar}>
            <Text style={styles.btnText}>Salvar e Gerar Prontuário</Text>
          </TouchableOpacity>
          
          <View style={{ height: 100 }} /> 
        </ScrollView>
      </KeyboardAvoidingView>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2196F3', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { width: '48%', marginBottom: 15 },
  label: { fontSize: 14, color: '#666', marginBottom: 5 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 10
  },
  input: { flex: 1, height: 45, fontSize: 16, color: '#333' },
  unit: { fontSize: 12, color: '#999', fontWeight: 'bold' },
  imcBox: { 
    marginTop: 10, 
    padding: 15, 
    backgroundColor: '#e3f2fd', 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  imcLabel: { fontWeight: 'bold', color: '#1976D2' },
  imcValue: { fontSize: 22, fontWeight: 'bold', color: '#1976D2' },
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  switchLabel: { fontSize: 15, color: '#444' },
  btnSalvar: { 
    backgroundColor: '#4CAF50', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginVertical: 10 
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});