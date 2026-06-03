import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';

// --- IMPORTAÇÕES DAS TELAS ---

// 1. Autenticação e Seleção de Perfil
import LoginScreen from '../screens/LoginScreen';
import ProfissionalSignupScreen from '../screens/ProfissionalSignupScreen';
import SelectionProfileScreen from '../screens/SelectionProfileScreen';

// 2. Fluxo do Paciente (Totem)
import RecepcaoScreen from '../screens/RecepcaoScreen';
import AnamneseScreen from '../screens/AnamneseScreen';
import PacienteCadastroScreen from '../screens/PacienteCadastroScreen';
import PacienteEsperaScreen from '../screens/PacienteEsperaScreen';
import SintomasScreen from '../screens/SintomasScreen';
import ResumoScreen from '../screens/ResumoScreen';

// 3. Fluxo do Médico
import MedicoDashboardScreen from '../screens/MedicoDashboardScreen';
import ProntuarioMedicoScreen from '../screens/ProntuarioMedicoScreen';

// 4. Fluxo da Enfermagem
import EnfermagemDashboardScreen from '../screens/EnfermagemDashboardScreen';
import ProcedimentosEnfermagemScreen from '../screens/ProcedimentosEnfermagemScreen';
import TriagemAvancadaScreen from '../screens/TriagemAvancadaScreen';

// 5. Telas Comuns e Auxiliares
import HomeScreen from '../screens/HomeScreen';
import RealTimeTranslationScreen from '../screens/RealTimeTranslationScreen';
import ProfissionalScreen from '../screens/ProfissionalScreen';
import RecursosNativosScreen from '../screens/RecursosNativosScreen';

// Tipagem de Rotas
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Tabs para Pacientes (se logado no app) e Profissionais
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Início') iconName = 'home';
          else if (route.name === 'Tradutor') iconName = 'camera';
          else if (route.name === 'Profissional') iconName = 'medkit';
          else if (route.name === 'Recursos') iconName = 'locate';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Tradutor" component={RealTimeTranslationScreen} />
      <Tab.Screen name="Recursos" component={RecursosNativosScreen} />
      <Tab.Screen name="Profissional" component={ProfissionalScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SelectionProfile">
        
        <Stack.Screen name="SelectionProfile" component={SelectionProfileScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ProfissionalSignup" component={ProfissionalSignupScreen} />
        
        <Stack.Screen name="Main" component={MainTabs} />

        <Stack.Screen name="Recepcao" component={RecepcaoScreen} />
        <Stack.Screen name="Anamnese" component={AnamneseScreen} />
        <Stack.Screen name="PacienteCadastro" component={PacienteCadastroScreen} />
        <Stack.Screen name="Sintomas" component={SintomasScreen} />
        <Stack.Screen name="Resumo" component={ResumoScreen} />
        <Stack.Screen name="PacienteEspera" component={PacienteEsperaScreen} />

        <Stack.Screen name="MedicoDashboard" component={MedicoDashboardScreen} />
        <Stack.Screen name="ProntuarioMedico" component={ProntuarioMedicoScreen} />

        <Stack.Screen name="EnfermagemDashboard" component={EnfermagemDashboardScreen} />
        <Stack.Screen name="ProcedimentosEnfermagem" component={ProcedimentosEnfermagemScreen} />
        <Stack.Screen name="TriagemAvancada" component={TriagemAvancadaScreen} />
        
        <Stack.Screen name="RealTimeTranslation" component={RealTimeTranslationScreen} />

      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
}
