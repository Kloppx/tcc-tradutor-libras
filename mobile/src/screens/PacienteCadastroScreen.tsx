import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import MaskInput from 'react-native-mask-input';
import { RootStackScreenProps } from '../types/navigation';
import { LibrasFAB } from '../components/GlobalComponents';
import { createPatient } from '../services/api';

type Props = RootStackScreenProps<'PacienteCadastro'>;

export default function PacienteCadastroScreen({ navigation }: Props) {
  // Dados Demográficos
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [idade, setIdade] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [endereco, setEndereco] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [sus, setSus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Data e Hora (Timestamp para BI)
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const agora = new Date();
    setTimestamp(agora.toISOString()); // Formato padrão para BI
  }, []);

  // Cálculo Automático da Idade (BI)
  useEffect(() => {
    if (dataNascimento.length === 10) {
      const [dia, mes, ano] = dataNascimento.split('/');
      if (parseInt(dia) > 31 || parseInt(mes) > 12) {
        setIdade('');
        return;
      }
      const dataNasc = new Date(`${ano}-${mes}-${dia}`);
      const hoje = new Date();
      
      let idadeCalculada = hoje.getFullYear() - dataNasc.getFullYear();
      const m = hoje.getMonth() - dataNasc.getMonth();
      
      if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
        idadeCalculada--;
      }
      
      if (!isNaN(idadeCalculada) && idadeCalculada >= 0) {
        setIdade(idadeCalculada.toString());
      } else {
        setIdade('');
      }
    } else {
      setIdade('');
    }
  }, [dataNascimento]);

  const handleGerarSenha = async () => {
    const unmaskedCpf = cpf.replace(/\D/g, '');
    const unmaskedSus = sus.replace(/\D/g, '');

    if (!nome.trim() || !dataNascimento || !estadoCivil || !endereco || !rg) {
      Toast.show({ type: 'error', text1: 'Campos obrigatórios', text2: 'Por favor, preencha todos os dados.' });
      return;
    }
    if (unmaskedCpf.length !== 11) {
      Toast.show({ type: 'error', text1: 'CPF Inválido', text2: 'O CPF deve conter 11 dígitos.' });
      return;
    }
    if (unmaskedSus.length !== 15) {
      Toast.show({ type: 'error', text1: 'Cartão SUS Inválido', text2: 'O Cartão SUS deve conter 15 dígitos.' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await createPatient({
        nome,
        idade: idade ? Number(idade) : undefined,
        estadoCivil,
        endereco,
        rg,
        cpf: unmaskedCpf,
        sus: unmaskedSus,
        dataNascimento,
        status: 'waiting',
      });

      Toast.show({ type: 'success', text1: 'Cadastro realizado!', text2: 'Sua senha foi gerada.' });
      navigation.navigate('PacienteEspera', {
        pacienteNome: response.patient.nome.split(' ')[0],
        pacienteId: response.patient.id,
        senha: response.patient.senha,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Falha no cadastro',
        text2: error instanceof Error ? error.message : 'Não foi possível registrar o paciente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color="#333" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Ficha de Cadastro</Text>
            <Text style={styles.headerSubtitle}>Preencha seus dados para gerar a senha de atendimento.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Digite seu nome completo" placeholderTextColor="#888" />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Data de Nascimento</Text>
                <MaskInput style={styles.input} value={dataNascimento} onChangeText={setDataNascimento} mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]} placeholder="DD/MM/AAAA" keyboardType="numeric" />
              </View>
              <View style={{ width: 90 }}>
                <Text style={styles.label}>Idade</Text>
                <TextInput style={[styles.input, styles.inputDisabled]} value={idade} placeholder="Auto" editable={false} />
              </View>
            </View>

            <Text style={styles.label}>Estado Civil</Text>
            <View style={styles.chipContainer}>
              {['Solteiro(a)', 'Casado(a)', 'Outro'].map((opcao) => (
                <TouchableOpacity key={opcao} style={[styles.chip, estadoCivil === opcao && styles.chipActive]} onPress={() => setEstadoCivil(opcao)}>
                  <Text style={[styles.chipText, estadoCivil === opcao && styles.chipTextActive]}>{opcao}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Endereço</Text>
            <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} placeholder="Rua, número e bairro" placeholderTextColor="#888" />
            
            <Text style={styles.label}>RG</Text>
            <TextInput style={styles.input} value={rg} onChangeText={setRg} placeholder="Digite seu RG" keyboardType="numeric" placeholderTextColor="#888" />

            <Text style={styles.label}>CPF</Text>
            <MaskInput style={styles.input} value={cpf} onChangeText={setCpf} mask={[/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/]} placeholder="000.000.000-00" keyboardType="numeric" />

            <Text style={styles.label}>Cartão SUS</Text>
            <MaskInput style={styles.input} value={sus} onChangeText={setSus} mask={[/\d/,/\d/,/\d/,' ',/\d/,/\d/,/\d/,/\d/,' ',/\d/,/\d/,/\d/,/\d/,' ',/\d/,/\d/,/\d/,/\d/]} placeholder="000 0000 0000 0000" keyboardType="numeric" />

            <TouchableOpacity style={styles.submitButton} onPress={handleGerarSenha} disabled={isSaving}>
              <Text style={styles.submitButtonText}>{isSaving ? 'SALVANDO...' : 'CONCLUIR E GERAR SENHA'}</Text>
              <Ionicons name="arrow-forward-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingBottom: 40, paddingTop: 80 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1, padding: 5 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50' },
  headerSubtitle: { fontSize: 16, color: '#7F8C8D', marginTop: 8, textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#5D6D7E', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7E9', fontSize: 16, color: '#333' },
  inputDisabled: { backgroundColor: '#EAECEE', color: '#808B96' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  chipContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  chip: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: '#BDC3C7' },
  chipActive: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  chipText: { fontSize: 14, fontWeight: 'bold', color: '#34495E' },
  chipTextActive: { color: '#fff' },
  submitButton: { flexDirection: 'row', backgroundColor: '#2ECC71', paddingVertical: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 15, elevation: 3 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 10 }
});