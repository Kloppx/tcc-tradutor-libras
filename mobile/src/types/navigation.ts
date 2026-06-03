import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type PacienteTriagem = {
  id?: string;
  nome: string;
  idade?: number;
  senha?: string;
  risco?: 'Vermelho' | 'Amarelo' | 'Verde';
  especialidade?: string;
  status?: string;
  triagem?: {
    pa?: string;
    temp?: string;
    spo2?: string;
    peso?: string;
    queixa?: string;
  };
};

export type RootStackParamList = {
  SelectionProfile: undefined;
  Login: undefined;
  ProfissionalSignup: undefined;
  Main: undefined;

  Recepcao: undefined;
  Anamnese: undefined;
  PacienteCadastro: undefined;
  PacienteEspera: { pacienteNome: string; pacienteId?: string; senha?: string };
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

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;