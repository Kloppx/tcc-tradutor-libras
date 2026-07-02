import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function AnamneseScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [motivo, setMotivo] = useState('');

  // Máscara de CPF Corrigida
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPeso = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 3) {
      return digits;
    }
    return `${digits.slice(0, 3)},${digits.slice(3)}`;
  };

  const maskAltura = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 3);
    if (digits.length <= 1) {
      return digits;
    }
    return `${digits.slice(0, 1)},${digits.slice(1)}`;
  };

  const handleNext = () => {
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (nome.trim().length < 3) {
      Toast.show({ type: 'error', text1: 'Nome incompleto' });
      return;
    }
    
    if (cpfLimpo.length !== 11) {
      Toast.show({ type: 'error', text1: 'CPF Inválido' });
      return;
    }

    if (motivo.trim().length < 3) {
      Toast.show({ type: 'error', text1: 'Queixa principal incompleta' });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Anamnese registrada',
      text2: 'Você foi encaminhado para a fila de espera.',
    });

    navigation.navigate('PacienteEspera', {
      pacienteNome: nome.split(' ')[0] || 'Paciente',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HealthHeader title="Sua Identificação" />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Digite seu nome"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput 
            style={styles.input} 
            placeholder="000.000.000-00"
            keyboardType="numeric"
            value={cpf}
            onChangeText={(txt) => setCpf(maskCPF(txt))}
            maxLength={14}
          />

          <Text style={styles.label}>Peso (opcional)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: 75,5"
            keyboardType="numeric"
            value={peso}
            onChangeText={(txt) => setPeso(maskPeso(txt))}
            maxLength={5}
          />

          <Text style={styles.label}>Altura (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1,70"
            keyboardType="numeric"
            value={altura}
            onChangeText={(txt) => setAltura(maskAltura(txt))}
            maxLength={4}
          />

          <Text style={styles.label}>O que você está sentindo?</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Ex: Dor de cabeça..."
            multiline
            value={motivo}
            onChangeText={setMotivo}
          />

          <TouchableOpacity style={styles.btnNext} onPress={handleNext}>
            <Text style={styles.btnText}>PRÓXIMO PASSO</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  scroll: { padding: 25 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 15, marginBottom: 20, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  btnNext: { backgroundColor: '#2196F3', flexDirection: 'row', padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginRight: 10 }
});