import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// --- IMPORTAÇÕES DAS TELAS ---

// 1. Autenticação e Entrada
import LoginScreen from './src/screens/LoginScreen';
import ProfissionalSignupScreen from './src/screens/ProfissionalSignupScreen';

// 2. Fluxo do Paciente (Novo Totem)
import RecepcaoScreen from './src/screens/RecepcaoScreen';
import PacienteCadastroScreen from './src/screens/PacienteCadastroScreen';
import PacienteEsperaScreen from './src/screens/PacienteEsperaScreen';

// 3. Fluxo do Médico
import MedicoDashboardScreen from './src/screens/MedicoDashboardScreen';
import ProntuarioMedicoScreen from './src/screens/ProntuarioMedicoScreen';

// 4. Fluxo da Enfermagem
import EnfermagemDashboardScreen from './src/screens/EnfermagemDashboardScreen';
import ProcedimentosEnfermagemScreen from './src/screens/ProcedimentosEnfermagemScreen';
import TriagemAvancadaScreen from './src/screens/TriagemAvancadaScreen';

// 5. Auxiliares e Componentes Globais
import HomeScreen from './src/screens/HomeScreen';
import RealTimeTranslationScreen from './src/screens/RealTimeTranslationScreen';
import AnamneseScreen from './src/screens/AnamneseScreen'; // Mantido caso use em outra triagem
import BodySelectionScreen from './src/screens/BodySelectionScreen';
import SintomasScreen from './src/screens/SintomasScreen';
import ResumoScreen from './src/screens/ResumoScreen';

// Tipagem de Rotas
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Tabs do Paciente (Opcional, caso ele acesse logado pelo celular)
function PacienteTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Início') iconName = 'home';
          else if (route.name === 'Sobre') iconName = 'information-circle';
          else if (route.name === 'UBS') iconName = 'map';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="UBS" component={() => <View><Text style={{marginTop:50, textAlign:'center'}}>Mapa das UBS em Maceió</Text></View>} />
      <Tab.Screen name="Sobre" component={() => <View><Text style={{marginTop:50, textAlign:'center'}}>Interpretarte v1.0</Text></View>} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* === AUTENTICAÇÃO E CADASTRO === */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ProfissionalSignup" component={ProfissionalSignupScreen} />
        
        {/* === FLUXO DO PACIENTE (RECEPCAO / TOTEM) === */}
        <Stack.Screen name="Recepcao" component={RecepcaoScreen} />
        <Stack.Screen name="PacienteCadastro" component={PacienteCadastroScreen} />
        <Stack.Screen name="PacienteEspera" component={PacienteEsperaScreen} />
        <Stack.Screen name="PacienteFlow" component={PacienteTabs} />

        {/* === FLUXO MÉDICO === */}
        <Stack.Screen name="MedicoDashboard" component={MedicoDashboardScreen} />
        <Stack.Screen name="ProntuarioMedico" component={ProntuarioMedicoScreen} />

        {/* === FLUXO ENFERMAGEM === */}
        <Stack.Screen name="EnfermagemDashboard" component={EnfermagemDashboardScreen} />
        <Stack.Screen name="ProcedimentosEnfermagem" component={ProcedimentosEnfermagemScreen} />
        <Stack.Screen name="TriagemAvancada" component={TriagemAvancadaScreen} />

        {/* === TELAS AUXILIARES E GLOBAIS === */}
        <Stack.Screen name="Anamnese" component={AnamneseScreen} />
        <Stack.Screen name="BodySelection" component={BodySelectionScreen} />
        <Stack.Screen name="Sintomas" component={SintomasScreen} />
        <Stack.Screen name="Resumo" component={ResumoScreen} />
        <Stack.Screen name="RealTimeTranslation" component={RealTimeTranslationScreen} />

      </Stack.Navigator>

      {/* Componente Global de Toast para Alertas Visuais */}
      <Toast />
    </NavigationContainer>
  );
}