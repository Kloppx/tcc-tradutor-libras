import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type PacienteTriagem = {
  id?: string;
  nome: string;
  idade?: number;
  senha?: string;
  risco?: 'Vermelho' | 'Amarelo' | 'Verde';
  especialidade?: string;
  triagem?: {
    pa?: string;
    temp?: string;
    spo2?: string;
    peso?: string;
    queixa?: string;
  };
};

// Lista das telas e o que elas recebem de parametro (undefined = nada)
export type RootStackParamList = {
  SelectionProfile: undefined;
  Login: undefined;
  ProfissionalSignup: undefined;
  Main: undefined;

  Recepcao: undefined;
  Anamnese: undefined;
  PacienteCadastro: undefined;
  PacienteEspera: { pacienteNome: string };
  BodySelection: { peso: string; altura: string };
  Sintomas: { region: string; peso: string; altura: string };
  Resumo: { peso: string; altura: string; sintomas: string[]; region: string };

  EnfermagemDashboard: undefined;
  TriagemAvancada: { paciente?: PacienteTriagem } | undefined;
  ProcedimentosEnfermagem: undefined;

  MedicoDashboard: undefined;
  ProntuarioMedico: { paciente: PacienteTriagem };

  RealTimeTranslation: undefined;
  Profissional: undefined;
  Home: undefined;
};

// Helper para usar nas telas
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;