import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { loginProfessional } from '../services/api';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginProfissional = async () => {
    if (email === '' || senha === '') {
      Toast.show({
        type: 'error',
        text1: 'Campos Vazios',
        text2: 'Por favor, insira seu e-mail e senha.'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginProfessional(email, senha);
      const usuarioEncontrado = response.user;

      Toast.show({
        type: 'success',
        text1: `Bem-vindo(a), ${usuarioEncontrado.name}!`,
        text2: 'Acesso liberado.'
      });

      if (usuarioEncontrado.role === 'Medico') {
        navigation.replace('MedicoDashboard');
      } else {
        navigation.replace('EnfermagemDashboard'); 
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Acesso Negado',
        text2: error instanceof Error ? error.message : 'Credenciais inválidas. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Acesso Profissional</Text>
          <Text style={styles.headerSubtitle}>Faça login para gerenciar pacientes e atendimentos.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={22} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="E-mail profissional" 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#888"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Senha" 
              value={senha}
              onChangeText={setSenha}
              secureTextEntry 
              placeholderTextColor="#888"
            />
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLoginProfissional}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>{isLoading ? 'ENTRANDO...' : 'ENTRAR'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signupLink}
            onPress={() => navigation.navigate('ProfissionalSignup')}
          >
            <Text style={styles.signupText}>
              Não tem uma conta? <Text style={styles.signupLinkText}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContent: { 
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
    marginBottom: 40,
    marginTop: 80, // Espaço para o botão de voltar
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
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7E9',
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: { 
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  loginButton: { 
    backgroundColor: '#3498DB', 
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 3,
    shadowColor: '#3498DB',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { height: 4, width: 0 },
  },
  loginButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  signupLink: { 
    marginTop: 25, 
    alignItems: 'center' 
  },
  signupText: { 
    color: '#7F8C8D', 
    fontSize: 14 
  },
  signupLinkText: { 
    color: '#3498DB', 
    fontWeight: 'bold' 
  }
});