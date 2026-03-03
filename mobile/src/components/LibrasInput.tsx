import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  sinalDescricao?: string; // Texto que explica o sinal (pra gente testar)
};

export default function LibrasInput({ label, placeholder, value, onChangeText, keyboardType = 'default', sinalDescricao }: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
        
        {/* O BOTÃO DA MÃOZINHA - ACESSIBILIDADE */}
        <TouchableOpacity style={styles.handButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="hand-right" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* POP-UP (MODAL) QUE SIMULA O VÍDEO EM LIBRAS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="videocam" size={50} color="#2196F3" />
            <Text style={styles.modalTitle}>Tradução em Libras</Text>
            <Text style={styles.modalText}>
              {sinalDescricao || `Aqui será exibido o vídeo explicando o campo "${label}".`}
            </Text>
            
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textStyle}>Entendi</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 16, color: '#333', marginBottom: 5, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16
  },
  handButton: {
    height: 50,
    width: 50,
    backgroundColor: '#2196F3', // Azul padrão do app
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  // Estilos do Modal
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { margin: 20, backgroundColor: "white", borderRadius: 20, padding: 35, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  button: { borderRadius: 10, padding: 10, elevation: 2, marginTop: 15, width: 100 },
  buttonClose: { backgroundColor: "#2196F3" },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" },
  modalText: { marginBottom: 15, textAlign: "center", color: '#666' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 }
});