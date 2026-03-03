import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import Toast from 'react-native-toast-message'; // BÔNUS (+0,5)

export default function RecepcaoScreen({ navigation }: any) {
  const [etapa, setEtapa] = useState<'cadastro' | 'espera'>('cadastro');
  const [loadingCep, setLoadingCep] = useState(false);
  
  // Estados do Formulário (Todos os campos recuperados!)
  const [nome, setNome] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [idade, setIdade] = useState('');
  const [estadoCivil, setEstadoCivil] = useState<'Solteiro' | 'Casado' | 'Outro' | null>(null);
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [sus, setSus] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');

  // --- MÁSCARAS (Requisito de Validação) ---
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
  const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);
  const maskSUS = (v: string) => v.replace(/\D/g, '').substring(0, 15);
  const maskRG = (v: string) => v.replace(/\D/g, '').substring(0, 9);

  // --- LÓGICA: CÁLCULO DE IDADE AUTOMÁTICO ---
  useEffect(() => {
    if (nascimento.length === 10) {
      const [dia, mes, ano] = nascimento.split('/').map(Number);
      const hoje = new Date();
      let age = hoje.getFullYear() - ano;
      const m = hoje.getMonth() - (mes - 1);
      if (m < 0 || (m === 0 && hoje.getDate() < dia)) age--;
      setIdade(age.toString());
    }
  }, [nascimento]);

  // --- LÓGICA: BUSCA DE CEP (API ViaCEP) ---
  const buscarCEP = async (valor: string) => {
    const clean = valor.replace(/\D/g, '').substring(0, 8);
    setCep(clean);
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setEndereco(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
        } else {
          Toast.show({ type: 'error', text1: 'CEP não encontrado' });
        }
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Erro na conexão' });
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleGerarSenha = () => {
    // Validação Simples (Requisito da Matéria)
    if (!nome || !cpf || !sus || !estadoCivil) {
      Toast.show({
        type: 'error',
        text1: 'Campos Obrigatórios',
        text2: 'Preencha Nome, CPF, SUS e Estado Civil.'
      });
      return;
    }

    const novaSenha = "H-" + Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setSenha(novaSenha);
    
    Toast.show({
      type: 'success',
      text1: 'Cadastro Concluído! ✅',
      text2: `Sua senha é ${novaSenha}. Aguarde ser chamado.`
    });
    
    setEtapa('espera');
  };

  // Lógica do Alerta Visual (Piscando)
  const blinkAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (etapa === 'espera') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [etapa]);

  if (etapa === 'espera') {
    return (
      <View style={styles.container}>
        <HealthHeader title="Aguarde sua Vez" />
        <View style={styles.centerContent}>
          <Text style={styles.statusLabel}>Sua senha de atendimento:</Text>
          <Text style={styles.senhaText}>{senha}</Text>
          <Animated.View style={[styles.blinkIndicator, { opacity: blinkAnim }]}>
            <Text style={styles.blinkText}>AGUARDE SER CHAMADO</Text>
          </Animated.View>
          <Text style={styles.instrucao}>O profissional de enfermagem chamará sua senha em breve.</Text>
          <TouchableOpacity style={styles.btnVoltarMenu} onPress={() => navigation.navigate('PacienteFlow')}>
            <Text style={styles.btnVoltarMenuText}>Sair da Espera</Text>
          </TouchableOpacity>
        </View>
        <LibrasFAB />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HealthHeader title="Recepção e Cadastro" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formPadding}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Identificação</Text>
            
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome do paciente" />

            <View style={styles.row}>
              <View style={{ width: '58%' }}>
                <Text style={styles.label}>Data Nascimento</Text>
                <TextInput 
                  style={styles.input} 
                  value={nascimento} 
                  onChangeText={(t) => setNascimento(maskDate(t))} 
                  placeholder="DD/MM/AAAA" 
                  keyboardType="numeric" 
                />
              </View>
              <View style={{ width: '38%' }}>
                <Text style={styles.label}>Idade (Auto)</Text>
                <TextInput style={[styles.input, { backgroundColor: '#eee' }]} value={idade} editable={false} />
              </View>
            </View>

            <Text style={styles.label}>Estado Civil *</Text>
            <View style={styles.row}>
              {['Solteiro', 'Casado', 'Outro'].map((op) => (
                <TouchableOpacity 
                  key={op} 
                  style={[styles.chip, estadoCivil === op && styles.chipSelected]}
                  onPress={() => setEstadoCivil(op as any)}
                >
                  <Text style={[styles.chipText, estadoCivil === op && styles.chipTextSelected]}>{op}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Localização</Text>
            <Text style={styles.label}>CEP (Automático)</Text>
            <View style={{ position: 'relative' }}>
              <TextInput style={styles.input} value={cep} onChangeText={buscarCEP} placeholder="00000000" keyboardType="numeric" maxLength={8} />
              {loadingCep && <ActivityIndicator style={styles.loader} color="#2196F3" />}
            </View>
            <Text style={styles.label}>Endereço Completo</Text>
            <TextInput style={[styles.input, { height: 60 }]} value={endereco} onChangeText={setEndereco} multiline />

            <Text style={styles.sectionTitle}>Documentação</Text>
            <Text style={styles.label}>Cartão SUS (15 dígitos) *</Text>
            <TextInput style={styles.input} value={sus} onChangeText={(t) => setSus(maskSUS(t))} keyboardType="numeric" maxLength={15} />

            <View style={styles.row}>
              <View style={{ width: '48%' }}>
                <Text style={styles.label}>RG</Text>
                <TextInput style={styles.input} value={rg} onChangeText={(t) => setRg(maskRG(t))} keyboardType="numeric" maxLength={9} />
              </View>
              <View style={{ width: '48%' }}>
                <Text style={styles.label}>CPF *</Text>
                <TextInput style={styles.input} value={cpf} onChangeText={(t) => setCpf(maskCPF(t))} keyboardType="numeric" maxLength={14} />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.btnPrincipal} onPress={handleGerarSenha}>
            <Text style={styles.btnPrincipalText}>GERAR SENHA E AGUARDAR</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  formPadding: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2196F3', marginBottom: 15 },
  label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  chip: { flex: 1, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center', marginHorizontal: 2 },
  chipSelected: { backgroundColor: '#2196F3' },
  chipText: { color: '#666', fontSize: 12 },
  chipTextSelected: { color: '#fff', fontWeight: 'bold' },
  loader: { position: 'absolute', right: 10, top: 12 },
  btnPrincipal: { backgroundColor: '#2196F3', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnPrincipalText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  statusLabel: { fontSize: 18, color: '#666' },
  senhaText: { fontSize: 80, fontWeight: 'bold', color: '#2196F3', marginVertical: 20 },
  blinkIndicator: { backgroundColor: '#FF5252', padding: 15, borderRadius: 30, marginBottom: 20 },
  blinkText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  instrucao: { textAlign: 'center', color: '#888', marginBottom: 40, lineHeight: 20 },
  btnVoltarMenu: { padding: 15 },
  btnVoltarMenuText: { color: '#2196F3', fontWeight: 'bold' }
});