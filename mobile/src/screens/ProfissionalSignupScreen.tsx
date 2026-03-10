import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import Toast from 'react-native-toast-message';

export default function ProfissionalSignupScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [conselho, setConselho] = useState('');
  const [senha, setSenha] = useState('');
  
  // Lógica de Diferenciação: Estado para o Cargo
  const [cargo, setCargo] = useState<'Enfermeiro' | 'Medico' | null>(null);

  const handleSignup = () => {
    if (!nome || !email || !conselho || !senha || !cargo) {
      Toast.show({
        type: 'error',
        text1: 'Campos obrigatórios',
        text2: 'Selecione seu cargo e preencha todos os campos.'
      });
      return;
    }

    // No BI, aqui estaríamos classificando o registro na dimensão 'Dim_Profissional'
    Toast.show({
      type: 'success',
      text1: 'Solicitação Enviada! 📩',
      text2: `Aguarde a validação do seu ${cargo === 'Medico' ? 'CRM' : 'COREN'}.`
    });
    
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <HealthHeader title="Cadastro Profissional" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              Identifique sua categoria profissional para liberar as funções específicas na UBS.
            </Text>

            {/* SELETOR DE CARGO (Diferenciação Visual) */}
            <Text style={styles.label}>Selecione sua categoria:</Text>
            <View style={styles.row}>
              <TouchableOpacity 
                style={[
                  styles.chip, 
                  cargo === 'Enfermeiro' && styles.chipEnfermeiroActive
                ]} 
                onPress={() => setCargo('Enfermeiro')}
              >
                <Text style={[
                  styles.chipText, 
                  cargo === 'Enfermeiro' && styles.textWhite
                ]}>ENFERMEIRO (COREN)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.chip, 
                  cargo === 'Medico' && styles.chipMedicoActive
                ]} 
                onPress={() => setCargo('Medico')}
              >
                <Text style={[
                  styles.chipText, 
                  cargo === 'Medico' && styles.textWhite
                ]}>MÉDICO (CRM)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome Completo</Text>
            <TextInput 
              style={styles.input} 
              value={nome} 
              onChangeText={setNome} 
              placeholder="Digite seu nome"
            />

            <Text style={styles.label}>E-mail Institucional</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seuemail@ubs.gov.br"
            />

            <Text style={styles.label}>Número do Registro (AL)</Text>
            <TextInput 
              style={styles.input} 
              value={conselho} 
              onChangeText={setConselho} 
              placeholder={cargo === 'Medico' ? "CRM: 12345" : "COREN: 12345"}
            />

            <Text style={styles.label}>Defina uma Senha</Text>
            <TextInput 
              style={styles.input} 
              value={senha} 
              onChangeText={setSenha} 
              secureTextEntry 
              placeholder="••••••••"
            />

            <TouchableOpacity 
              style={[
                styles.btnSignup, 
                cargo === 'Medico' ? styles.bgBlue : styles.bgGreen
              ]} 
              onPress={handleSignup}
            >
              <Text style={styles.btnText}>SOLICITAR ACESSO</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scroll: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3 },
  infoText: { fontSize: 13, color: '#666', marginBottom: 20, textAlign: 'center', lineHeight: 18 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chip: { 
    flex: 0.48, 
    paddingVertical: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    alignItems: 'center',
    backgroundColor: '#f9f9f9'
  },
  chipEnfermeiroActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  chipMedicoActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  chipText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  textWhite: { color: '#fff' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  btnSignup: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  bgGreen: { backgroundColor: '#4CAF50' },
  bgBlue: { backgroundColor: '#2196F3' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});