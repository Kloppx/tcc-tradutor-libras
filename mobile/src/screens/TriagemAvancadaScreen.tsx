import React, { useState, useEffect } from 'react';
import { 
  ScrollView, View, Text, StyleSheet, TextInput, Switch, 
  TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { RootStackScreenProps } from '../types/navigation';
import { LibrasFAB } from '../components/GlobalComponents';

type Props = RootStackScreenProps<'TriagemAvancada'>;

// Componente de Input Acessível
const TitledInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default', editable = true, accessibilityLabel, ...props }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, !editable && styles.inputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      editable={editable}
      placeholderTextColor="#A9CCE3"
      accessibilityLabel={accessibilityLabel || label}
      {...props}
    />
  </View>
);

// Componente de Switch Acessível
const TitledSwitch = ({ label, value, onValueChange }: any) => (
  <View style={styles.switchRow} accessible={true} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label}>
    <Text style={styles.switchLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#5A7896', true: '#82E0AA' }}
      thumbColor={value ? '#2ECC71' : '#F0F4F8'}
      ios_backgroundColor="#5A7896"
    />
  </View>
);

export default function TriagemAvancadaScreen({ route, navigation }: Props) {
  const paciente = route.params?.paciente || { nome: 'Paciente Padrão', idade: 30 };

  // Sinais Vitais e Biometria
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [imc, setImc] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [pressao, setPressao] = useState('');
  const [pulso, setPulso] = useState('');
  const [saturacao, setSaturacao] = useState('');
  const [freqResp, setFreqResp] = useState('');
  const [glicemia, setGlicemia] = useState('');
  const [glasgow, setGlasgow] = useState('15');

  // Condições Clínicas
  const [vacinaEmDia, setVacinaEmDia] = useState(true);
  const [has, setHas] = useState(false);
  const [dm, setDm] = useState(false);
  const [gravidez, setGravidez] = useState(false);
  const [temAlergia, setTemAlergia] = useState(false);
  const [alergiaDesc, setAlergiaDesc] = useState('');

  // Sinais de Alerta
  const [taquicardia, setTaquicardia] = useState(false);
  const [dispneia, setDispneia] = useState(false);
  const [sangramento, setSangramento] = useState(false);

  // Cálculo Automático do IMC (BI)
  useEffect(() => {
    const p = parseFloat(peso.replace(',', '.'));
    const a = parseFloat(altura.replace(',', '.'));
    if (p > 0 && a > 0) {
      const alturaMetros = a > 3 ? a / 100 : a; // Converte cm para m se necessário
      const imcCalculado = p / (alturaMetros * alturaMetros);
      setImc(imcCalculado.toFixed(1));
    } else {
      setImc('');
    }
  }, [peso, altura]);

  const handleSalvar = () => {
    if (!peso || !altura || !temperatura || !pressao) {
      Toast.show({ type: 'error', text1: 'Dados Essenciais Faltando', text2: 'Peso, Altura, Temp. e PA são obrigatórios.' });
      return;
    }
    Toast.show({ type: 'success', text1: 'Triagem Salva!', text2: `Dados de ${paciente.nome} enviados ao prontuário.` });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5276" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar para o painel">
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Triagem Avançada</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.patientInfoBar}>
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
            <Text style={styles.patientName}>{paciente.nome}, {paciente.idade} anos</Text>
          </View>

          {/* Card de Sinais Vitais */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sinais Vitais e Biometria</Text>
            <View style={styles.row}>
              <TitledInput label="Peso (kg)" value={peso} onChangeText={setPeso} placeholder="70,5" keyboardType="decimal-pad" />
              <TitledInput label="Altura (m)" value={altura} onChangeText={setAltura} placeholder="1,75" keyboardType="decimal-pad" />
              <TitledInput label="IMC" value={imc} placeholder="Auto" editable={false} accessibilityLabel={`IMC calculado: ${imc || 'não calculado'}`} />
            </View>
            <View style={styles.row}>
              <TitledInput label="Temp. (°C)" value={temperatura} onChangeText={setTemperatura} placeholder="36,5" keyboardType="decimal-pad" />
              <TitledInput label="PA (mmHg)" value={pressao} onChangeText={setPressao} placeholder="120/80" />
              <TitledInput label="Pulso (bpm)" value={pulso} onChangeText={setPulso} placeholder="80" keyboardType="number-pad" />
            </View>
            <View style={styles.row}>
              <TitledInput label="Sat O₂ (%)" value={saturacao} onChangeText={setSaturacao} placeholder="98" keyboardType="number-pad" />
              <TitledInput label="FR (irpm)" value={freqResp} onChangeText={setFreqResp} placeholder="16" keyboardType="number-pad" />
              <TitledInput label="Glasgow" value={glasgow} onChangeText={setGlasgow} placeholder="15" keyboardType="number-pad" />
            </View>
            <TitledInput label="Glicemia (mg/dL)" value={glicemia} onChangeText={setGlicemia} placeholder="95" keyboardType="number-pad" />
          </View>

          {/* Card de Condições Clínicas */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Condições Clínicas</Text>
            <TitledSwitch label="Vacinação em dia" value={vacinaEmDia} onValueChange={setVacinaEmDia} />
            <TitledSwitch label="Hipertensão (HAS)" value={has} onValueChange={setHas} />
            <TitledSwitch label="Diabetes (DM)" value={dm} onValueChange={setDm} />
            <TitledSwitch label="Suspeita de Gravidez" value={gravidez} onValueChange={setGravidez} />
            <TitledSwitch label="Possui Alergias" value={temAlergia} onValueChange={setTemAlergia} />
            {temAlergia && (
              <TitledInput label="Descreva as alergias" value={alergiaDesc} onChangeText={setAlergiaDesc} placeholder="Ex: Dipirona, frutos do mar" />
            )}
          </View>

          {/* Card de Sinais de Alerta */}
          <View style={[styles.card, styles.alertCard]}>
            <Text style={[styles.cardTitle, styles.alertCardTitle]}>Sinais de Alerta</Text>
            <TitledSwitch label="Taquicardia / Dor no peito" value={taquicardia} onValueChange={setTaquicardia} />
            <TitledSwitch label="Dispneia / Falta de ar" value={dispneia} onValueChange={setDispneia} />
            <TitledSwitch label="Sangramento Ativo" value={sangramento} onValueChange={setSangramento} />
          </View>
          
          <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate('BodySelection', { peso, altura })}>
            <Ionicons name="body-outline" size={24} color="#fff" />
            <Text style={styles.mapButtonText}>Mapear Dor Corporal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
            <Text style={styles.saveButtonText}>SALVAR TRIAGEM</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C3E50' }, // Verde escuro WCAG
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#1A5276' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  scrollContent: { padding: 15, paddingBottom: 100 },
  patientInfoBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, marginBottom: 15 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  card: { backgroundColor: '#F0F4F8', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  inputContainer: { flex: 1, marginBottom: 10 },
  label: { fontSize: 14, color: '#5A7896', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 16, color: '#1C3A59', borderWidth: 1, borderColor: '#D6DBDF' },
  inputDisabled: { backgroundColor: '#EAECEE', color: '#808B96' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#D6DBDF' },
  switchLabel: { fontSize: 16, color: '#2C3E50', fontWeight: '500' },
  alertCard: { backgroundColor: '#FADBD8' },
  alertCardTitle: { color: '#C0392B' },
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3498DB', padding: 15, borderRadius: 12, marginTop: 10 },
  mapButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  saveButton: { backgroundColor: '#2ECC71', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});