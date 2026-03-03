import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { RootStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type Props = RootStackScreenProps<'BodySelection'>;

export default function BodySelectionScreen({ route, navigation }: Props) {
  
  // Recupera os dados vindo da AnamneseScreen
  const { peso, altura } = route.params;

  // Variável para animação do Scanner
  const scannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startScanning();
  }, []);

  const startScanning = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scannerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scannerAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const handleSelectRegion = (region: string) => {
    // Repassa o peso e altura junto com a nova região selecionada
    navigation.navigate('Sintomas', { 
      region: region,
      peso: peso,
      altura: altura
    });
  };

  const scannerTranslateY = scannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500] 
  });

  return (
    <View style={styles.container}>
      
      {/* 📊 PAINEL DE DADOS DO PACIENTE */}
      <View style={styles.dataBadge}>
        <View style={styles.dataItem}>
          <Ionicons name="fitness" size={16} color="#2196F3" />
          <Text style={styles.dataText}>{peso} kg</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.dataItem}>
          <Ionicons name="resize" size={16} color="#2196F3" />
          <Text style={styles.dataText}>{altura} m</Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Mapeamento Corporal</Text>
        <Text style={styles.subtitle}>Toque na região onde sente desconforto.</Text>
      </View>

      <View style={styles.bodyContainer}>
        <Image 
          source={require('../../assets/body_silhouette.png')} 
          style={styles.bodyImage} 
          resizeMode="contain"
        />

        <Animated.View 
          style={[
            styles.scannerBar, 
            { transform: [{ translateY: scannerTranslateY }] }
          ]} 
        />

        {/* --- CAMADA DE TOQUE (HITBOXES) --- */}
        <TouchableOpacity 
          style={[styles.hitbox, { top: '9%', left: '42.5%', width: '18%', height: '12%' }]}
          onPress={() => handleSelectRegion('Cabeça')}
        />

        <TouchableOpacity 
          style={[styles.hitbox, { top: '25%', left: '40%', width: '25%', height: '25%' }]}
          onPress={() => handleSelectRegion('Tronco')}
        />

        <TouchableOpacity 
          style={[styles.hitbox, { top: '25%', left: '30%', width: '8%', height: '32%', transform: [{ rotate: '10deg' }] }]}
          onPress={() => handleSelectRegion('Braço Direito')}
        />

        <TouchableOpacity 
          style={[styles.hitbox, { top: '25%', right: '26%', width: '8%', height: '32%', transform: [{ rotate: '-10deg' }] }]}
          onPress={() => handleSelectRegion('Braço Esquerdo')}
        />

        <TouchableOpacity 
          style={[styles.hitbox, { top: '50%', left: '39%', width: '25%', height: '40%' }]}
          onPress={() => handleSelectRegion('Membros Inferiores')}
        />
      </View>

      <View style={styles.footerInfo}>
        <Ionicons name="scan-outline" size={24} color="#2196F3" />
        <Text style={styles.footerText}>IA analisando padrões...</Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', alignItems: 'center' },
  
  // Estilos do Painel de Dados
  dataBadge: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#eee',
    marginHorizontal: 15,
  },

  header: { marginTop: 30, marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  bodyContainer: {
    width: width * 0.9, 
    height: 500,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  bodyImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  scannerBar: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#00E5FF',
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 2,
  },
  hitbox: {
    position: 'absolute',
    backgroundColor: 'transparent', 
    zIndex: 10,
  },
  footerInfo: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
    opacity: 0.7
  },
  footerText: { marginLeft: 10, color: '#2196F3', fontWeight: 'bold' }
});