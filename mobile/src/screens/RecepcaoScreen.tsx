import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function RecepcaoScreen({ navigation }: any) {
  const handleLoginExistente = () => {
    // Simulação: Paciente já cadastrado gera senha e vai pra fila
    Toast.show({ type: 'success', text1: 'Cadastro localizado!', text2: 'Gerando sua senha...' });
    navigation.navigate('PacienteEspera', { pacienteNome: 'Paciente Retorno' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HealthHeader title="Atendimento UBS" />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close-circle-outline" size={28} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Ionicons name="people-circle-outline" size={60} color="#2196F3" />
          <Text style={styles.welcomeTitle}>Bem-vindo à Recepção</Text>
          <Text style={styles.welcomeSub}>Como podemos ajudar você hoje?</Text>
        </View>

        {/* OPÇÃO 1: JÁ TEM CADASTRO */}
        <TouchableOpacity style={styles.actionCardBlue} onPress={handleLoginExistente}>
          <Ionicons name="log-in-outline" size={32} color="#fff" />
          <View style={styles.actionTextContent}>
            <Text style={styles.actionTitleWhite}>Já tenho cadastro</Text>
            <Text style={styles.actionDescWhite}>Acessar com CPF ou Cartão SUS</Text>
          </View>
        </TouchableOpacity>

        {/* OPÇÃO 2: NOVO CADASTRO */}
        <TouchableOpacity 
          style={styles.actionCardWhite} 
          onPress={() => navigation.navigate('PacienteCadastro')}
        >
          <Ionicons name="document-text-outline" size={32} color="#2196F3" />
          <View style={styles.actionTextContent}>
            <Text style={styles.actionTitleBlue}>Novo Cadastro</Text>
            <Text style={styles.actionDescGray}>Primeiro atendimento na unidade</Text>
          </View>
        </TouchableOpacity>
      </View>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 5 },
  content: { padding: 20, flex: 1, justifyContent: 'center' },
  welcomeCard: { alignItems: 'center', marginBottom: 40 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 15 },
  welcomeSub: { fontSize: 16, color: '#666', marginTop: 5 },
  actionCardBlue: { backgroundColor: '#2196F3', borderRadius: 15, padding: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20, elevation: 3 },
  actionCardWhite: { backgroundColor: '#fff', borderRadius: 15, padding: 25, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', elevation: 1 },
  actionTextContent: { marginLeft: 15, flex: 1 },
  actionTitleWhite: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  actionDescWhite: { fontSize: 13, color: '#e0f0ff', marginTop: 3 },
  actionTitleBlue: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },
  actionDescGray: { fontSize: 13, color: '#888', marginTop: 3 }
});