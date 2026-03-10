import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function PacienteCadastroScreen({ navigation }: any) {
  // Dados do Cliente
  const [nome, setNome] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [idade, setIdade] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [endereco, setEndereco] = useState('');
  const [sus, setSus] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Data e Hora do Atendimento
  const [dataHoraAtual, setDataHoraAtual] = useState('');

  useEffect(() => {
    const agora = new Date();
    setDataHoraAtual(agora.toLocaleString('pt-BR'));
  }, []);

  // Cálculo Automático da Idade
  useEffect(() => {
    if (nascimento.length === 10) {
      const [dia, mes, ano] = nascimento.split('/');
      const dataNasc = new Date(`${ano}-${mes}-${dia}`);
      const hoje = new Date();
      
      let idadeCalculada = hoje.getFullYear() - dataNasc.getFullYear();
      const m = hoje.getMonth() - dataNasc.getMonth();
      
      // Ajusta se ainda não fez aniversário no ano atual
      if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
        idadeCalculada--;
      }
      
      if (!isNaN(idadeCalculada) && idadeCalculada >= 0) {
        setIdade(idadeCalculada.toString());
      } else {
        setIdade('');
      }
    } else {
      setIdade(''); // Limpa se a data estiver incompleta
    }
  }, [nascimento]);

  // Máscaras
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const maskData = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\/\d{4})\d+?$/, '$1');
  const maskSUS = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1 $2').replace(/(\d{4})(\d)/, '$1 $2').replace(/(\d{4})(\d)/, '$1 $2').replace(/( \d{4})\d+?$/, '$1');

  const handleCadastrar = () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const susLimpo = sus.replace(/\D/g, '');

    // Validações Básicas
    if (nome.trim().length < 5 || !nascimento || !idade || !estadoCivil || !endereco || !rg) {
      Toast.show({ type: 'error', text1: 'Campos obrigatórios', text2: 'Preencha todos os dados solicitados.' });
      return;
    }
    if (cpfLimpo.length !== 11) {
      Toast.show({ type: 'error', text1: 'CPF Inválido', text2: 'O CPF precisa ter 11 números.' });
      return;
    }
    if (susLimpo.length !== 15) {
      Toast.show({ type: 'error', text1: 'Cartão SUS Inválido', text2: 'O Cartão SUS precisa ter 15 números.' });
      return;
    }

    Toast.show({ type: 'success', text1: 'Cadastro Concluído!' });
    navigation.navigate('PacienteEspera', { pacienteNome: nome });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HealthHeader title="Ficha de Cadastro" />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.infoBoxText}>Início do Atendimento: {dataHoraAtual}</Text>
          </View>

          <Text style={styles.label}>Nome Completo</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome do paciente" maxLength={80} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Data de Nasc.</Text>
              <TextInput style={styles.input} value={nascimento} onChangeText={(txt) => setNascimento(maskData(txt))} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} />
            </View>
            <View style={{ width: 90 }}>
              <Text style={styles.label}>Idade</Text>
              {/* Campo de idade agora fica bloqueado e em tom de cinza indicando que é automático */}
              <TextInput 
                style={[styles.input, { backgroundColor: '#e9ecef', color: '#666' }]} 
                value={idade} 
                placeholder="Auto" 
                editable={false} 
              />
            </View>
          </View>

          <Text style={styles.label}>Estado Civil</Text>
          {/* Opções visuais em vez de texto livre */}
          <View style={styles.rowOptions}>
            {['Solteiro(a)', 'Casado(a)', 'Outro'].map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={[styles.chipOpcao, estadoCivil === opcao && styles.chipOpcaoAtivo]}
                onPress={() => setEstadoCivil(opcao)}
              >
                <Text style={[styles.chipOpcaoTexto, estadoCivil === opcao && styles.textWhite]}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Endereço Completo</Text>
          <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} placeholder="Rua, Número, Bairro" />

          <Text style={styles.label}>Número do Cartão SUS</Text>
          <TextInput style={styles.input} value={sus} onChangeText={(txt) => setSus(maskSUS(txt))} placeholder="000 0000 0000 0000" keyboardType="numeric" maxLength={18} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>RG</Text>
              <TextInput style={styles.input} value={rg} onChangeText={setRg} placeholder="Número do RG" keyboardType="numeric" maxLength={12} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>CPF</Text>
              <TextInput style={styles.input} value={cpf} onChangeText={(txt) => setCpf(maskCPF(txt))} placeholder="000.000.000-00" keyboardType="numeric" maxLength={14} />
            </View>
          </View>

          <TouchableOpacity style={styles.btnNext} onPress={handleCadastrar}>
            <Text style={styles.btnText}>GERAR SENHA DE ATENDIMENTO</Text>
            <Ionicons name="ticket-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  scroll: { padding: 25 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6ff', padding: 12, borderRadius: 8, marginBottom: 20 },
  infoBoxText: { marginLeft: 8, fontSize: 13, color: '#333', fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 15, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowOptions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  chipOpcao: { flex: 1, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 3 },
  chipOpcaoAtivo: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  chipOpcaoTexto: { fontSize: 13, color: '#666', fontWeight: 'bold' },
  textWhite: { color: '#fff' },
  btnNext: { backgroundColor: '#4CAF50', flexDirection: 'row', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 3 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginRight: 10 }
});