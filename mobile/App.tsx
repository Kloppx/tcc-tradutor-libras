import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message'; // BÔNUS: Biblioteca Externa (+0,5 ponto)

// Importando Telas e Tipos
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AnamneseScreen from './src/screens/AnamneseScreen';
import BodySelectionScreen from './src/screens/BodySelectionScreen';
import SintomasScreen from './src/screens/SintomasScreen';
import ResumoScreen from './src/screens/ResumoScreen';
import ProfissionalScreen from './src/screens/ProfissionalScreen';
import RealTimeTranslationScreen from './src/screens/RealTimeTranslationScreen';
import TriagemAvancadaScreen from './src/screens/TriagemAvancadaScreen'; 
import RecepcaoScreen from './src/screens/RecepcaoScreen'; 
import SelectionProfileScreen from './src/screens/SelectionProfileScreen';
import ProntuarioMedicoScreen from './src/screens/ProntuarioMedicoScreen';
import ProcedimentosEnfermagemScreen from './src/screens/ProcedimentosEnfermagemScreen';
import EnfermagemDashboardScreen from './src/screens/EnfermagemDashboardScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Menu Inferior do Paciente (BÔNUS: Subnavegação +0,5 ponto)
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
        {/* 1. AUTENTICAÇÃO E FLUXO INICIAL */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PacienteFlow" component={PacienteTabs} />

        {/* 2. SELEÇÃO DE PERFIL PROFISSIONAL */}
        <Stack.Screen
          name="SelectionProfile"
          component={SelectionProfileScreen}
        />
        
        {/* 3. FLUXO DE ENFERMAGEM */}
        <Stack.Screen
          name="EnfermagemDashboard"
          component={EnfermagemDashboardScreen}
        />
        <Stack.Screen
          name="ProcedimentosEnfermagem"
          component={ProcedimentosEnfermagemScreen}
        />
        <Stack.Screen 
          name="TriagemAvancada" 
          component={TriagemAvancadaScreen} 
          options={{ headerShown: false }} 
        />

        {/* 4. FLUXO MÉDICO */}
        <Stack.Screen
          name="ProntuarioMedico"
          component={ProntuarioMedicoScreen}
        />

        {/* 5. FLUXO PACIENTE / RECEPÇÃO */}
        <Stack.Screen 
          name="Recepcao" 
          component={RecepcaoScreen} 
          options={{ headerShown: false }} 
        />

        {/* TELAS AUXILIARES / LEGADO */}
        <Stack.Screen 
          name="Anamnese" 
          component={AnamneseScreen} 
          options={{ 
            headerShown: true, 
            title: 'Identificação',
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff'
          }} 
        />
        <Stack.Screen 
          name="BodySelection" 
          component={BodySelectionScreen} 
          options={{ 
            headerShown: true, 
            title: 'Mapa Corporal', 
            headerStyle: { backgroundColor: '#2196F3' }, 
            headerTintColor: '#fff' 
          }} 
        />
        <Stack.Screen 
          name="Sintomas" 
          component={SintomasScreen} 
          options={{ 
            headerShown: true,
            title: 'Sintomas', 
            headerStyle: { backgroundColor: '#2196F3' }, 
            headerTintColor: '#fff' 
          }} 
        />
        <Stack.Screen 
          name="Resumo" 
          component={ResumoScreen} 
          options={{ 
            headerShown: true,
            title: 'Resumo da Triagem', 
            headerStyle: { backgroundColor: '#4CAF50' }, 
            headerTintColor: '#fff' 
          }} 
        />
        <Stack.Screen 
          name="RealTimeTranslation" 
          component={RealTimeTranslationScreen} 
          options={{ 
            headerShown: true,
            title: 'Tradutor de Libras', 
            headerStyle: { backgroundColor: '#2196F3' }, 
            headerTintColor: '#fff' 
          }} 
        />
        <Stack.Screen
          name="ProfissionalHome"
          component={ProfissionalScreen}
        />
      </Stack.Navigator>

      {/* COMPONENTE TOAST: Deve ficar aqui para sobrepor todas as telas */}
      <Toast />
    </NavigationContainer>
  );
}