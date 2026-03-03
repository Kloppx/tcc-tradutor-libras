import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import LibrasInput from '../components/LibrasInput';
import { RootStackScreenProps } from '../types/navigation';

type Props = RootStackScreenProps<'Anamnese'>;

export default function AnamneseScreen({ navigation }: Props) {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [alergias, setAlergias] = useState('');

  const handleContinuar = () => {
    if (!peso || !altura) {
      Alert.alert("Atenção", "Por favor, preencha peso e altura antes de continuar.");
      return;
    }
    // Navega para a tela do corpo repassando os dados coletados
    navigation.navigate('BodySelection', { 
      peso: peso, 
      altura: altura 
    });
  };

  return (
    // 1. Evita que o teclado cubra os inputs
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80} // Ajuste conforme a altura do seu header
    >
      {/* 2. Permite fechar o teclado ao tocar em qualquer área vazia */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Ficha de Triagem</Text>
            <Text style={styles.subtitle}>Preencha seus dados básicos.</Text>
          </View>

          <View style={styles.form}>
            <LibrasInput 
              label="Peso (kg)*" 
              placeholder="Ex: 70" 
              keyboardType="numeric"
              value={peso}
              onChangeText={setPeso}
              sinalDescricao="Vídeo: Sinal de 'PESO' + 'QUAL?'"
            />

            <LibrasInput 
              label="Altura (cm)*" 
              placeholder="Ex: 175" 
              keyboardType="numeric"
              value={altura}
              onChangeText={setAltura}
              sinalDescricao="Vídeo: Sinal de 'ALTURA' + 'QUAL?'"
            />

            <LibrasInput 
              label="Possui Alergias?" 
              placeholder="Ex: Dipirona, Frutos do mar..." 
              value={alergias}
              onChangeText={setAlergias}
              sinalDescricao="Vídeo: Sinal de 'ALERGIA' + 'TEM?'"
            />
            
            <TouchableOpacity style={styles.button} onPress={handleContinuar}>
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { flexGrow: 1 }, // Garante que o ScrollView ocupe o espaço necessário
  header: { padding: 20, backgroundColor: '#fff', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2196F3' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  form: { padding: 20 },
  button: { 
    backgroundColor: '#FF9800', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20, 
    elevation: 3,
    marginBottom: 40 // Espaço extra no final para não ficar colado no teclado
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});