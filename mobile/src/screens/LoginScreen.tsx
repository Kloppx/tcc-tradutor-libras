import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>INTERPRETARTE</Text>
        <Text style={styles.tagline}>Acessibilidade que salva vidas</Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* BOTÃO PACIENTE - AZUL */}
        <TouchableOpacity 
          style={styles.btnPaciente} 
          onPress={() => navigation.navigate('Recepcao')}
        >
          <Text style={styles.btnText}>SOU PACIENTE</Text>
        </TouchableOpacity>

        {/* BOTÃO PROFISSIONAL - VERDE (Voltando ao padrão anterior) */}
        <TouchableOpacity 
          style={styles.btnProfissional} 
          onPress={() => navigation.navigate('SelectionProfile')}
        >
          <Text style={styles.btnText}>SOU PROFISSIONAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    padding: 30 
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 60 
  },
  logoText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#2196F3' 
  },
  tagline: { 
    fontSize: 16, 
    color: '#666', 
    marginTop: 5 
  },
  buttonContainer: { 
    width: '100%' 
  },
  btnPaciente: { 
    backgroundColor: '#2196F3', 
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 3 
  },
  btnProfissional: { 
    backgroundColor: '#4CAF50', // O verde que você pediu
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    elevation: 3 
  },
  btnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});