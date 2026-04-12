import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import MaskInput from 'react-native-mask-input';
import { RootStackScreenProps } from '../types/navigation';
import { LibrasFAB } from '../components/GlobalComponents';

type Props = RootStackScreenProps<'Recepcao'>;

export default function RecepcaoScreen({ navigation }: Props) {
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [cpf, setCpf] = useState('');
  const [sus, setSus] = useState('');

  const handleExistingPatient = () => {
    setShowLookupModal(true);
  };

  const handleConfirmLookup = () => {
    const cpfDigits = cpf.replace(/\D/g, '');
    const susDigits = sus.replace(/\D/g, '');

    if (cpfDigits.length !== 11 && susDigits.length !== 15) {
      Toast.show({
        type: 'error',
        text1: 'Dados inválidos',
        text2: 'Informe CPF (11 dígitos) ou Cartão SUS (15 dígitos).',
      });
      return;
    }

    setShowLookupModal(false);
    setCpf('');
    setSus('');
    Toast.show({
      type: 'success',
      text1: 'Identificação confirmada',
      text2: 'Senha gerada. Siga para o painel de espera.',
    });
    navigation.navigate('PacienteEspera', { pacienteNome: 'Paciente Retorno' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={28} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="medkit-outline" size={60} color="#1E88E5" />
          <Text style={styles.title}>Autoatendimento</Text>
          <Text style={styles.subtitle}>Selecione uma opção para iniciar sua triagem.</Text>
        </View>

        {/* OPÇÃO 1: NOVO CADASTRO */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('PacienteCadastro')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Primeiro atendimento"
          accessibilityHint="Abre o cadastro completo para novo paciente"
        >
          <Ionicons name="person-add-outline" size={40} color="#27AE60" />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Primeiro Atendimento</Text>
            <Text style={styles.cardDesc}>Crie seu cadastro e inicie a triagem.</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#BDBDBD" />
        </TouchableOpacity>

        {/* OPÇÃO 2: JÁ TEM CADASTRO */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={handleExistingPatient}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Já tenho cadastro"
          accessibilityHint="Abre identificação por CPF ou Cartão SUS"
        >
          <Ionicons name="id-card-outline" size={40} color="#2980B9" />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Já Tenho Cadastro</Text>
            <Text style={styles.cardDesc}>Use seu CPF ou Cartão SUS para continuar.</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#BDBDBD" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Anamnese')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Anamnese guiada"
          accessibilityHint="Abre a etapa de identificação e queixa principal"
        >
          <Ionicons name="clipboard-outline" size={40} color="#8E44AD" />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Anamnese Guiada</Text>
            <Text style={styles.cardDesc}>Fluxo assistido de identificação e sintomas.</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#BDBDBD" />
        </TouchableOpacity>
      </View>

      <Modal visible={showLookupModal} transparent animationType="fade" onRequestClose={() => setShowLookupModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Paciente já cadastrado</Text>
            <Text style={styles.modalSubtitle}>Informe CPF ou Cartão SUS para continuar.</Text>

            <Text style={styles.modalLabel}>CPF</Text>
            <MaskInput
              style={styles.modalInput}
              value={cpf}
              onChangeText={setCpf}
              mask={[/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/]}
              keyboardType="numeric"
              placeholder="000.000.000-00"
              placeholderTextColor="#8FA5BC"
              accessibilityLabel="Campo CPF"
            />

            <Text style={styles.modalLabel}>Cartão SUS</Text>
            <MaskInput
              style={styles.modalInput}
              value={sus}
              onChangeText={setSus}
              mask={[/\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/]}
              keyboardType="numeric"
              placeholder="000 0000 0000 0000"
              placeholderTextColor="#8FA5BC"
              accessibilityLabel="Campo Cartão SUS"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowLookupModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmLookup}>
                <Text style={styles.confirmButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 5,
  },
  content: { 
    paddingHorizontal: 20,
    justifyContent: 'center',
    flex: 1,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 50,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1C3A59', 
    marginTop: 15,
  },
  subtitle: { 
    fontSize: 17, 
    color: '#5A7896', 
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#333',
  },
  cardDesc: { 
    fontSize: 14, 
    color: '#777', 
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C3A59',
  },
  modalSubtitle: {
    color: '#5A7896',
    marginTop: 4,
    marginBottom: 14,
  },
  modalLabel: {
    color: '#355372',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#D3DCE5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C3A59',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#EEF2F6',
  },
  cancelButtonText: {
    color: '#4E657C',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#1E88E5',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});