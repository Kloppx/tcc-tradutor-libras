import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { HealthHeader, LibrasFAB } from '../components/GlobalComponents';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function TriagemAvancadaScreen({ route, navigation }: any) {
  // Recupera os dados do paciente que vieram da fila
  const pacienteAtual = route?.params?.paciente || { nome: 'Paciente em Triagem' };

  // --- ESTADOS: SINAIS VITAIS ---
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [imc, setImc] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [pressao, setPressao] = useState('');
  const [pulso, setPulso] = useState(''); // Representa Pulso / Freq. Cardíaca
  const [saturacao, setSaturacao] = useState('');
  const [freqResp, setFreqResp] = useState('');
  const [glicemia, setGlicemia] = useState('');
  const [glasgow, setGlasgow] = useState('');

  // --- ESTADOS: CONDIÇÕES E HISTÓRICO ---
  const [temAlergia, setTemAlergia] = useState(false);
  const [alergiaDesc, setAlergiaDesc] = useState('');
  const [vacinaDia, setVacinaDia] = useState(true);
  const [has, setHas] = useState(false); // Hipertensão
  const [dm, setDm] = useState(false); // Diabetes
  const [gravidez, setGravidez] = useState(false);

  // --- ESTADOS: SINAIS DE ALERTA ---
  const [taquicardiaDor, setTaquicardiaDor] = useState(false);
  const [dispneia, setDispneia] = useState(false);
  const [sangramento, setSangramento] = useState(false);

  // Cálculo Automático do IMC
  useEffect(() => {
    const p = parseFloat(peso.replace(',', '.'));
    const a = parseFloat(altura.replace(',', '.'));
    
    if (p > 0 && a > 0) {
      const alturaMetros = a > 3 ? a / 100 : a;
      const calculo = p / (alturaMetros * alturaMetros);
      setImc(calculo.toFixed(1));
    } else {
      setImc('');
    }
  }, [peso, altura]);

  const handleSalvarTriagem = () => {
    if (!peso || !pressao || !temperatura) {
      Toast.show({
        type: 'error',
        text1: 'Dados Incompletos',
        text2: 'Preencha ao menos Peso, PA e Temperatura.'
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Triagem Registrada!',
      text2: 'Os dados foram salvos no prontuário do paciente.'
    });
    navigation.goBack();
  };

  // ♿ Componente SwitchRow Acessível (Agrupa texto e switch para o leitor de ecrã)
  const SwitchRow = ({ label, value, onValueChange }: any) => (
    <View 
      style={styles.switchRow}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={`Toque duas vezes para alterar o status de ${label}`}
    >
      <Text style={styles.switchLabel} importantForAccessibility="no">{label}</Text>
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ false: '#ddd', true: '#a5d6a7' }}
        thumbColor={value ? '#2e7d32' : '#f4f3f4'} // Verde mais escuro para melhor contraste
        importantForAccessibility="no-hide-descendants" // Esconde do leitor de ecrã para não ler duas vezes
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HealthHeader title="Triagem Clínica" />
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Fechar triagem"
          accessibilityHint="Volta para o painel de enfermagem sem salvar as alterações"
        >
          <Ionicons name="close-circle-outline" size={28} color="#666" importantForAccessibility="no" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
          
          {/* NOME DO PACIENTE EM ATENDIMENTO */}
          <View style={{ marginBottom: 15, paddingHorizontal: 5 }} accessible={true}>
            <Text style={{ fontSize: 16, color: '#666' }}>A atender agora:</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }} accessibilityRole="header">
              {pacienteAtual.nome}
            </Text>
          </View>

          {/* SECÇÃO 1: SINAIS VITAIS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">Sinais Vitais e Biometria</Text>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput 
                  style={styles.input} value={peso} onChangeText={setPeso} placeholder="Ex: 75.5" keyboardType="numeric" 
                  accessibilityLabel="Campo de Peso em quilogramas"
                  accessibilityHint="Digite o peso do paciente"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Altura (m)</Text>
                <TextInput 
                  style={styles.input} value={altura} onChangeText={setAltura} placeholder="Ex: 1.75" keyboardType="numeric" 
                  accessibilityLabel="Campo de Altura em metros"
                  accessibilityHint="Digite a altura do paciente"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>IMC</Text>
                <TextInput 
                  style={[styles.input, styles.inputDisabled]} value={imc} placeholder="Auto" editable={false} 
                  accessibilityLabel={`Índice de Massa Corporal calculado é ${imc || 'vazio'}`}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Temp. (°C)</Text>
                <TextInput 
                  style={styles.input} value={temperatura} onChangeText={setTemperatura} placeholder="Ex: 36.5" keyboardType="numeric" 
                  accessibilityLabel="Campo de Temperatura em graus Celsius"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>PA (mmHg)</Text>
                <TextInput 
                  style={styles.input} value={pressao} onChangeText={setPressao} placeholder="Ex: 120/80" 
                  accessibilityLabel="Campo de Pressão Arterial"
                  accessibilityHint="Digite no formato cento e vinte por oitenta"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Pulso / FC</Text>
                <TextInput 
                  style={styles.input} value={pulso} onChangeText={setPulso} placeholder="Ex: 80" keyboardType="numeric" 
                  accessibilityLabel="Campo de Pulso ou Frequência Cardíaca em batimentos por minuto"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Saturação (%)</Text>
                <TextInput 
                  style={styles.input} value={saturacao} onChangeText={setSaturacao} placeholder="Ex: 98" keyboardType="numeric" 
                  accessibilityLabel="Campo de Saturação de Oxigénio em percentagem"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Freq. Resp.</Text>
                <TextInput 
                  style={styles.input} value={freqResp} onChangeText={setFreqResp} placeholder="Ex: 16" keyboardType="numeric" 
                  accessibilityLabel="Campo de Frequência Respiratória em incursões por minuto"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Glicemia</Text>
                <TextInput 
                  style={styles.input} value={glicemia} onChangeText={setGlicemia} placeholder="Ex: 99" keyboardType="numeric" 
                  accessibilityLabel="Campo de Glicemia Capilar"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Glasgow</Text>
                <TextInput 
                  style={styles.input} value={glasgow} onChangeText={setGlasgow} placeholder="Ex: 15" keyboardType="numeric" 
                  accessibilityLabel="Campo de Escala de Coma de Glasgow"
                />
              </View>
            </View>
          </View>

          {/* SECÇÃO 2: HISTÓRICO E CONDIÇÕES */}
          <View style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">Condições Clínicas</Text>

            <SwitchRow label="Vacinação em dia?" value={vacinaDia} onValueChange={setVacinaDia} />
            <SwitchRow label="Hipertensão Arterial (HAS)?" value={has} onValueChange={setHas} />
            <SwitchRow label="Diabetes Mellitus (DM)?" value={dm} onValueChange={setDm} />
            <SwitchRow label="Suspeita de Gravidez?" value={gravidez} onValueChange={setGravidez} />
            
            <View 
              style={[styles.switchRow, { borderBottomWidth: temAlergia ? 0 : 1 }]}
              accessible={true}
              accessibilityRole="switch"
              accessibilityState={{ checked: temAlergia }}
              accessibilityLabel="Paciente possui alergias?"
              accessibilityHint="Toque duas vezes para informar se o paciente tem alguma alergia"
            >
              <Text style={styles.switchLabel} importantForAccessibility="no">Possui Alergias?</Text>
              <Switch 
                value={temAlergia} 
                onValueChange={setTemAlergia} 
                trackColor={{ false: '#ddd', true: '#a5d6a7' }}
                thumbColor={temAlergia ? '#2e7d32' : '#f4f3f4'}
                importantForAccessibility="no-hide-descendants"
              />
            </View>
            {temAlergia && (
              <TextInput 
                style={[styles.input, { marginTop: 0, marginBottom: 15 }]} 
                placeholder="Qual medicamento/alergia?" 
                value={alergiaDesc}
                onChangeText={setAlergiaDesc}
                accessibilityLabel="Descreva a alergia ou medicamento"
              />
            )}
          </View>

          {/* SECÇÃO 3: SINAIS DE ALERTA */}
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: '#d32f2f' }]} accessibilityRole="header">Sinais de Alerta (Risco)</Text>
            <SwitchRow label="Taquicardia, Arritmia ou Dor" value={taquicardiaDor} onValueChange={setTaquicardiaDor} />
            <SwitchRow label="Dispneia ou Falta de ar" value={dispneia} onValueChange={setDispneia} />
            <SwitchRow label="Sangramento ativo" value={sangramento} onValueChange={setSangramento} />
          </View>

          {/* MAPEAMENTO CORPORAL */}
          <TouchableOpacity 
            style={styles.btnMapeamento}
            onPress={() => navigation.navigate('BodySelection', {
              paciente: {
                ...pacienteAtual,
                peso: peso || "Não informado"
              }
            })}
            accessibilityRole="button"
            accessibilityLabel="Realizar Mapeamento de Dor e Sintomas"
            accessibilityHint="Abre o modelo do corpo humano para selecionar as áreas de dor"
          >
            <Ionicons name="body-outline" size={24} color="#fff" importantForAccessibility="no" />
            <Text style={styles.btnMapeamentoText}>Mapeamento de Dor/Sintomas</Text>
          </TouchableOpacity>

          {/* SALVAR */}
          <TouchableOpacity 
            style={styles.btnSalvar} 
            onPress={handleSalvarTriagem}
            accessibilityRole="button"
            accessibilityLabel="Salvar Triagem no Prontuário"
            accessibilityHint="Salva os dados coletados e retorna para o painel principal"
          >
            <Ionicons name="save-outline" size={24} color="#fff" style={{ marginRight: 8 }} importantForAccessibility="no" />
            <Text style={styles.btnText}>Salvar Triagem no Prontuário</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 50, 
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8 }, // A11y: Cor mais escura e fonte 18px
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  halfInput: { width: '48%' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 4 }, // A11y: Fonte 14px
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 14, fontSize: 16, color: '#333' }, // A11y: Contraste na borda e fonte 16px
  inputDisabled: { backgroundColor: '#e9ecef', color: '#666' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  switchLabel: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1 }, // A11y: Fonte 16px
  btnMapeamento: { backgroundColor: '#1976D2', flexDirection: 'row', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 3 }, // A11y: Azul mais escuro
  btnMapeamentoText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 10 },
  btnSalvar: { backgroundColor: '#2e7d32', flexDirection: 'row', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 3 }, // A11y: Verde mais escuro para garantir 4.5:1
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});