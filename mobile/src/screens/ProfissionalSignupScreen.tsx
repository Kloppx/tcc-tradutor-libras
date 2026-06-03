import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { registerProfessional } from '../services/api';

export default function ProfissionalSignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [conselho, setConselho] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState<'Enfermeiro' | 'Medico' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!nome || !email || !conselho || !senha || !cargo) {
      Toast.show({
        type: 'error',
        text1: 'Campos obrigatórios',
        text2: 'Selecione seu cargo e preencha todos os campos.'
      });
      return;
    }

    setIsLoading(true);
    try {
      await registerProfessional({
        name: nome,
        email,
        password: senha,
        role: cargo,
        councilNumber: conselho,
      });

      Toast.show({
        type: 'success',
        text1: 'Solicitação Enviada!',
        text2: `Aguarde a validação do seu ${cargo === 'Medico' ? 'CRM' : 'COREN'}.`
      });

      navigation.navigate('Login');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Falha no cadastro',
        text2: error instanceof Error ? error.message : 'Não foi possível cadastrar o profissional.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color="#333" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Cadastro Profissional</Text>
            <Text style={styles.headerSubtitle}>Solicite seu acesso ao sistema.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Selecione sua categoria profissional:</Text>
            <View style={styles.chipContainer}>
              <TouchableOpacity 
                style={[styles.chip, cargo === 'Enfermeiro' && styles.chipActive]} 
                onPress={() => setCargo('Enfermeiro')}
              >
                <Ionicons name="medkit-outline" size={20} color={cargo === 'Enfermeiro' ? '#fff' : '#3498DB'} />
                <Text style={[styles.chipText, cargo === 'Enfermeiro' && styles.chipTextActive]}>Enfermagem</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.chip, cargo === 'Medico' && styles.chipActive]} 
                onPress={() => setCargo('Medico')}
              >
                <Ionicons name="pulse-outline" size={20} color={cargo === 'Medico' ? '#fff' : '#3498DB'} />
                <Text style={[styles.chipText, cargo === 'Medico' && styles.chipTextActive]}>Medicina</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome Completo" placeholderTextColor="#888" />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="E-mail institucional" placeholderTextColor="#888" />
            <TextInput style={styles.input} value={conselho} onChangeText={setConselho} placeholder={cargo === 'Medico' ? "Nº do CRM" : "Nº do COREN"} placeholderTextColor="#888" />
            <TextInput style={styles.input} value={senha} onChangeText={setSenha} secureTextEntry placeholder="Crie uma senha" placeholderTextColor="#888" />

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={isLoading}>
              <Text style={styles.signupButtonText}>{isLoading ? 'ENVIANDO...' : 'SOLICITAR ACESSO'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F4F8' 
  },
  scroll: { 
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  headerContainer: { 
    alignItems: 'center', 
    marginBottom: 30,
    marginTop: 80,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#2C3E50' 
  },
  headerSubtitle: { 
    fontSize: 16, 
    color: '#7F8C8D', 
    marginTop: 8,
    textAlign: 'center'
  },
  form: {
    width: '100%',
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#5D6D7E', 
    marginBottom: 10,
    marginLeft: 5,
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  chipActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  chipText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495E',
  },
  chipTextActive: {
    color: '#fff',
  },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E5E7E9',
    fontSize: 16,
    color: '#333',
  },
  signupButton: { 
    backgroundColor: '#2ECC71', 
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 3,
    shadowColor: '#2ECC71',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { height: 4, width: 0 },
  },
  signupButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});