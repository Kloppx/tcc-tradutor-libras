import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Lista das telas e o que elas recebem de parâmetro (undefined = nada)
export type RootStackParamList = {
  Login: undefined;
  PacienteFlow: undefined; // Esse é o grupo de abas (Home, Sobre, UBS)
  Anamnese: undefined;
  BodySelection: { peso: string, altura: string }; 
  Sintomas: { region: string, peso: string, altura: string };
  RealTimeTranslation: undefined;
  Resumo: { peso: string, altura: string, sintomas: string[], region: string };
  ProfissionalHome: undefined;
  TriagemAvancada: undefined;
  Recepcao: undefined;
  SelectionProfile: undefined;
  ProntuarioMedico: undefined;
  EnfermagemDashboard: undefined;
  ProcedimentosEnfermagem: undefined
};

// Helper para usar nas telas
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;