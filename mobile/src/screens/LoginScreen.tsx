import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Toast from 'react-native-toast-message';

// SIMULAÇÃO DE BANCO DE DATOS (BI Context)
const USERS_MOCK = [
  { email: 'medico@ubs.com', senha: '123', cargo: 'Medico', nome: 'Dr. Roberto' },
  { email: 'enfermeiro@ubs.com', senha: '123', cargo: 'Enfermeiro', nome: 'Enf. Márcia' }
];

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLoginProfissional = () => {
    if (email === '' || senha === '') {
      Toast.show({
        type: 'error',
        text1: 'Campos Vazios',
        text2: 'Por favor, insira suas credenciais profissionais.'
      });
      return;
    }

    const usuarioEncontrado = USERS_MOCK.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );

    if (usuarioEncontrado) {
      Toast.show({
        type: 'success',
        text1: `Olá, ${usuarioEncontrado.nome}! 👋`,
        text2: `Acesso liberado como ${usuarioEncontrado.cargo}.`
      });

      // --- LOGICA DE DIRECIONAMENTO ATUALIZADA ---
      if (usuarioEncontrado.cargo === 'Medico') {
        navigation.navigate('MedicoDashboard'); // Agora vai direto para a fila do médico
      } else {
        navigation.navigate('EnfermagemDashboard'); 
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Acesso Negado',
        text2: 'E-mail ou senha incorretos.'
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>INTERPRETARTE</Text>
          <Text style={styles.tagline}>Acessibilidade que salva vidas</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Acesso ao Paciente</Text>
          <TouchableOpacity 
            style={styles.btnPaciente} 
            onPress={() => navigation.navigate('Recepcao')}
          >
            <Text style={styles.btnText}>SOU PACIENTE (GERAR SENHA)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OU</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Acesso Restrito Profissional</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="E-mail profissional" 
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput 
            style={styles.input} 
            placeholder="Senha" 
            value={senha}
            onChangeText={setSenha}
            secureTextEntry 
          />

          <TouchableOpacity 
            style={styles.btnProfissional} 
            onPress={handleLoginProfissional}
          >
            <Text style={styles.btnText}>ENTRAR NO SISTEMA</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signupLink}
            onPress={() => navigation.navigate('ProfissionalSignup')}
          >
            <Text style={styles.signupText}>
              Primeiro acesso? <Text style={styles.boldText}>Solicite cadastro aqui.</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ... (Mantenha os estilos que você já tem, eles estão ótimos)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 30, justifyContent: 'center', flexGrow: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#2196F3' },
  tagline: { fontSize: 16, color: '#666', marginTop: 5 },
  section: { width: '100%', marginBottom: 15 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#aaa', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase' },
  input: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#eee', color: '#333' },
  btnPaciente: { backgroundColor: '#2196F3', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  btnProfissional: { backgroundColor: '#4CAF50', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#eee' },
  orText: { marginHorizontal: 15, color: '#ccc', fontWeight: 'bold', fontSize: 12 },
  signupLink: { marginTop: 20, alignItems: 'center' },
  signupText: { color: '#888', fontSize: 13 },
  boldText: { color: '#4CAF50', fontWeight: 'bold' }
});