import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';

type Props = RootStackScreenProps<'Resumo'>;

export default function ResumoScreen({ route, navigation }: Props) {
  const { peso, altura, sintomas, region } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.title}>Triagem Concluída!</Text>
          <Text style={styles.subtitle}>Seus dados foram enviados para a equipe médica.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Protocolo de Atendimento</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Peso:</Text>
            <Text style={styles.value}>{peso} kg</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Altura:</Text>
            <Text style={styles.value}>{altura} m</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.label}>Região Principal:</Text>
            <Text style={styles.value}>{region}</Text>
          </View>
          
          <Text style={[styles.label, {marginTop: 15}]}>Sintomas Relatados:</Text>
          <View style={styles.sintomasContainer}>
            {sintomas.map((s, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.btnHome} 
          onPress={() => navigation.navigate('SelectionProfile')}
        >
          <Text style={styles.btnHomeText}>Voltar para Início</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 20, alignItems: 'center' },
  header: { alignItems: 'center', marginVertical: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginTop: 10 },
  subtitle: { textAlign: 'center', color: '#666', marginTop: 5 },
  card: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 20, elevation: 4 },
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#2196F3', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#888', fontSize: 16 },
  value: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sintomasContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  badgeText: { color: '#2196F3', fontWeight: 'bold', fontSize: 14 },
  btnHome: { marginTop: 30, backgroundColor: '#2196F3', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnHomeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});