import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';
import { LibrasFAB } from '../components/GlobalComponents';

type Props = RootStackScreenProps<'PacienteEspera'>;

export default function PacienteEsperaScreen({ route, navigation }: Props) {
  const { pacienteNome } = route.params;
  const [senha] = useState(`N-${Math.floor(Math.random() * 90) + 10}`);
  const [isCalled, setIsCalled] = useState(false);
  
  // Animação para o alerta visual
  const [opacity] = useState(new Animated.Value(1));

  // Simula a chamada do paciente após 7 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCalled(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  // Lógica da animação de piscar
  useEffect(() => {
    if (isCalled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isCalled, opacity]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={isCalled ? '#2E7D32' : '#1C3A59'} />
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {pacienteNome}!</Text>
        <Text style={styles.subText}>Aguarde o seu chamado no painel abaixo.</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.ticketCard}>
          <Text style={styles.ticketLabel}>Sua Senha</Text>
          <Text style={styles.ticketNumber}>{senha}</Text>
        </View>

        {/* Alerta Visual de Chamada (WCAG) */}
        <Animated.View 
          style={[
            styles.statusBox, 
            isCalled ? styles.statusCalled : styles.statusWaiting,
            { opacity: isCalled ? opacity : 1 }
          ]}
          accessible={true}
          accessibilityLabel={isCalled ? "Você foi chamado. Dirija-se à triagem" : "Aguardando chamada"}
        >
          <Ionicons 
            name={isCalled ? "checkmark-circle-outline" : "time-outline"} 
            size={50} 
            color="#fff" 
          />
          <Text style={styles.statusText}>
            {isCalled ? "DIRIJA-SE À TRIAGEM" : "AGUARDANDO CHAMADA"}
          </Text>
        </Animated.View>
      </View>

      <TouchableOpacity 
        style={styles.homeButton} 
        onPress={() => navigation.navigate('SelectionProfile')}
        accessibilityLabel="Voltar para a tela inicial"
      >
        <Ionicons name="home-outline" size={24} color="#fff" />
        <Text style={styles.homeButtonText}>Início</Text>
      </TouchableOpacity>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1C3A59',
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  greeting: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff',
    textAlign: 'center',
  },
  subText: { 
    fontSize: 18, 
    color: '#A9CCE3', 
    marginTop: 8,
    textAlign: 'center',
  },
  content: { 
    flex: 1, 
    padding: 25, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  ticketCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    width: '100%', 
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20, 
    alignItems: 'center', 
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { height: 5, width: 0 },
    marginBottom: 40,
  },
  ticketLabel: { 
    fontSize: 18, 
    color: '#5A7896', 
    fontWeight: '600', 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ticketNumber: { 
    fontSize: 80, 
    fontWeight: 'bold', 
    color: '#1C3A59', 
    marginVertical: 10,
  },
  statusBox: { 
    width: '100%', 
    padding: 30, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 5,
  },
  statusWaiting: { 
    backgroundColor: '#5499C7', // Azul mais claro
  },
  statusCalled: { 
    backgroundColor: '#2E7D32', // Verde escuro (WCAG)
  },
  statusText: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginTop: 15,
    textAlign: 'center',
  },
  homeButton: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
});