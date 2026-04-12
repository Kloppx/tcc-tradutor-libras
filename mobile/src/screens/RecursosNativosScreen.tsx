import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';
import { LibrasFAB } from '../components/GlobalComponents';

type Coords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

type NetworkSnapshot = {
  type: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export default function RecursosNativosScreen() {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);

  const requestAndReadLocation = useCallback(async () => {
    try {
      setLoading(true);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permissão negada',
          text2: 'Ative a localização para usar o GPS.',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      });

      Toast.show({
        type: 'success',
        text1: 'GPS atualizado',
        text2: 'Localização capturada com sucesso.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao obter localização',
        text2: 'Verifique GPS e permissões do dispositivo.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const requestNetworkState = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setNetwork({
        type: state.type,
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
      Toast.show({
        type: 'success',
        text1: 'Rede atualizada',
        text2: `Tipo: ${state.type}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao ler rede',
        text2: 'Não foi possível identificar o estado de rede.',
      });
    }
  }, []);

  useEffect(() => {
    requestNetworkState();
  }, [requestNetworkState]);

  const formatDate = (ts: number) => new Date(ts).toLocaleString('pt-BR');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="hardware-chip-outline" size={28} color="#1C3A59" />
          <Text style={styles.title}>Recursos Nativos</Text>
        </View>

        <View style={styles.card}>
        <Text style={styles.cardTitle}>GPS (Localização do Dispositivo)</Text>
        <Text style={styles.cardDescription}>
          Use este painel para demonstrar permissão e leitura de coordenadas em tempo real, sem back-end.
        </Text>

        {coords ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Latitude</Text>
            <Text style={styles.infoValue}>{coords.latitude.toFixed(6)}</Text>

            <Text style={styles.infoLabel}>Longitude</Text>
            <Text style={styles.infoValue}>{coords.longitude.toFixed(6)}</Text>

            <Text style={styles.infoLabel}>Precisão</Text>
            <Text style={styles.infoValue}>{coords.accuracy ? `${Math.round(coords.accuracy)} m` : '--'}</Text>

            <Text style={styles.infoLabel}>Atualizado em</Text>
            <Text style={styles.infoValue}>{formatDate(coords.timestamp)}</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="locate-outline" size={36} color="#7F8C8D" />
            <Text style={styles.emptyText}>Nenhuma localização capturada ainda.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={requestAndReadLocation}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Atualizar localização GPS"
          accessibilityHint="Solicita permissão e captura coordenadas atuais"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="locate" size={20} color="#fff" />
              <Text style={styles.buttonText}>ATUALIZAR LOCALIZAÇÃO</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.cardTitle}>Identificação de Rede</Text>
        {network ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Tipo de rede</Text>
            <Text style={styles.infoValue}>{network.type}</Text>

            <Text style={styles.infoLabel}>Conectado</Text>
            <Text style={styles.infoValue}>{network.isConnected ? 'Sim' : 'Não'}</Text>

            <Text style={styles.infoLabel}>Internet alcançável</Text>
            <Text style={styles.infoValue}>{network.isInternetReachable ? 'Sim' : 'Não'}</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wifi-outline" size={36} color="#7F8C8D" />
            <Text style={styles.emptyText}>Estado de rede ainda não identificado.</Text>
          </View>
        )}

          <TouchableOpacity style={styles.button} onPress={requestNetworkState}>
            <Ionicons name="wifi-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>ATUALIZAR REDE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LibrasFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C3A59',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6EDF4',
    marginVertical: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  cardDescription: {
    marginTop: 6,
    color: '#5A7896',
    lineHeight: 20,
  },
  infoBox: {
    marginTop: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8EF',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7C8F',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#1C3A59',
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8EF',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7C8F',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#8EB9E4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
