import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';

type Props = RootStackScreenProps<'Sintomas'>;

// Dados "Mocados" (Fictícios) para o teste
const SINTOMAS_POR_REGIAO: Record<string, string[]> = {
  'Cabeça': ['Dor de Cabeça', 'Tontura', 'Visão Embaçada', 'Febre'],
  'Tronco': ['Falta de Ar', 'Dor no Peito', 'Tosse', 'Palpitações'],
  'Braço Direito': ['Dor Muscular', 'Formigamento', 'Inchaço', 'Ferimento'],
  'Braço Esquerdo': ['Dor Muscular', 'Formigamento', 'Dor irradiada', 'Fraqueza'],
  'Membros Inferiores': ['Dor no Joelho', 'Inchaço', 'Varizes', 'Câimbra'],
};

export default function SintomasScreen({ route, navigation }: Props) {
  // Pega a região que veio da tela anterior
  const { region } = route.params;
  
  // Lista de sintomas correspondentes (ou genéricos se não achar)
  const sintomasList = SINTOMAS_POR_REGIAO[region] || ['Dor', 'Desconforto', 'Outros'];

  // Estado para controlar quais sintomas foram marcados
  const [selecionados, setSelecionados] = useState<string[]>([]);
  
  // Controle do Modal de Libras
  const [modalVisible, setModalVisible] = useState(false);
  const [sinalAtual, setSinalAtual] = useState('');

  const toggleSintoma = (sintoma: string) => {
    if (selecionados.includes(sintoma)) {
      setSelecionados(selecionados.filter(item => item !== sintoma));
    } else {
      setSelecionados([...selecionados, sintoma]);
    }
  };

  const abrirLibras = (sintoma: string) => {
    setSinalAtual(sintoma);
    setModalVisible(true);
  };

  const finalizar = () => {
    Alert.alert(
      "Triagem Finalizada", 
      `Região: ${region}\nSintomas: ${selecionados.join(', ')}\n\nObrigado! Aguarde ser chamado.`,
      [{ text: "OK", onPress: () => navigation.navigate('PacienteFlow') }] // Volta pra Home
    );
  };

  const renderItem = ({ item }: { item: string }) => {
    const isSelected = selecionados.includes(item);
    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        
        {/* Checkbox e Texto */}
        <TouchableOpacity style={styles.checkArea} onPress={() => toggleSintoma(item)}>
          <Ionicons 
            name={isSelected ? "checkbox" : "square-outline"} 
            size={28} 
            color={isSelected ? "#2196F3" : "#999"} 
          />
          <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>{item}</Text>
        </TouchableOpacity>

        {/* Botão da Mãozinha (Acessibilidade) */}
        <TouchableOpacity style={styles.handButton} onPress={() => abrirLibras(item)}>
          <Ionicons name="hand-right" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{region}</Text>
        <Text style={styles.subtitle}>O que você está sentindo?</Text>
      </View>

      <FlatList
        data={sintomasList}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: 20 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, selecionados.length === 0 && styles.buttonDisabled]} 
          onPress={finalizar}
          disabled={selecionados.length === 0}
        >
          <Text style={styles.buttonText}>Finalizar Triagem</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE LIBRAS REUTILIZADO */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="videocam" size={60} color="#2196F3" />
            <Text style={styles.modalTitle}>Sinal: {sinalAtual.toUpperCase()}</Text>
            <Text style={styles.modalDesc}>Aqui passaria o vídeo explicando o sintoma.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2196F3' },
  subtitle: { fontSize: 16, color: '#666' },
  
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, alignItems: 'center', justifyContent: 'space-between', elevation: 1, overflow: 'hidden' },
  cardSelected: { backgroundColor: '#E3F2FD', borderColor: '#2196F3', borderWidth: 1 },
  
  checkArea: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15 },
  itemText: { fontSize: 18, marginLeft: 10, color: '#444' },
  itemTextSelected: { color: '#2196F3', fontWeight: 'bold' },
  
  handButton: { backgroundColor: '#2196F3', width: 60, height: '100%', justifyContent: 'center', alignItems: 'center' },
  
  footer: { padding: 20, backgroundColor: '#fff', elevation: 10 },
  button: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 15 },
  modalDesc: { textAlign: 'center', color: '#666', marginBottom: 20 },
  modalButton: { backgroundColor: '#2196F3', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20 },
  modalButtonText: { color: '#fff', fontWeight: 'bold' }
});