import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthHeader } from '../components/GlobalComponents';

export default function SelectionProfileScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <HealthHeader title="Acesso Profissional" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Selecione sua função:</Text>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('TriagemAvancada')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="medkit-outline" size={40} color="#2196F3" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.cardTitle}>Enfermagem / Triagem</Text>
            <Text style={styles.cardDesc}>Coleta de sinais vitais, IMC e checklists clínicos.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('ProntuarioMedico')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="person-add-outline" size={40} color="#4CAF50" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.cardTitle}>Médico / Prontuário</Text>
            <Text style={styles.cardDesc}>Consulta de triagem, diagnóstico e tradutor Libras.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 20, justifyContent: 'center', flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 20, textAlign: 'center' },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 20, 
    elevation: 3, 
    alignItems: 'center' 
  },
  iconBox: { padding: 15, borderRadius: 12 },
  textBox: { marginLeft: 15, flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 13, color: '#777', marginTop: 5 }
});