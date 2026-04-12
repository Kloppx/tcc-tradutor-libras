import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// --- CONFIGURAÇÃO ---
// Prioriza variável de ambiente (EXPO_PUBLIC_WS_URL).
// Fallback para desenvolvimento local quando a variável não estiver definida.
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://192.168.10.71:8000/ws/predict';

export default function RealTimeTranslationScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isConnected, setIsConnected] = useState(false);
  const [translation, setTranslation] = useState("Aguardando sinal...");
  const [confidence, setConfidence] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);
  const ws = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log("🟢 Conectado ao Servidor Python!");
        setIsConnected(true);
        startStreaming(); // Começa a enviar imagens
      };

      ws.current.onmessage = (e) => {
        // Recebe a resposta do Python
        const data = JSON.parse(e.data);
        if (data.status === 'predicted') {
          setTranslation(data.word);
          setConfidence(data.confidence);
        }
      };

      ws.current.onerror = (e) => {
        console.log('WebSocket error: falha ao conectar no servidor de tradução.');
        setIsConnected(false);
        setTranslation('Servidor de tradução indisponível');
        setConfidence(0);
        Toast.show({
          type: 'error',
          text1: 'Falha na conexão',
          text2: 'Verifique se o servidor Python está ativo e acessível na rede.',
        });
      };

      ws.current.onclose = () => {
        console.log("🔴 Desconectado");
        setIsConnected(false);
        setTranslation('Aguardando conexão com o servidor...');
        setConfidence(0);
        stopStreaming();
      };
    } catch (error) {
      console.log("Erro de conexão:", error);
    }
  };

  // 3. Loop de Envio de Imagens (O "Streaming")
  const startStreaming = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Envia um frame a cada 200ms (5 FPS) - Ajuste conforme necessário
    intervalRef.current = setInterval(async () => {
      if (cameraRef.current && ws.current?.readyState === WebSocket.OPEN) {
        try {
          // Tira uma foto em baixa qualidade (para ser rápido) e Base64
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.3, // 0.3 é suficiente para o MediaPipe
            base64: true,
            skipProcessing: true, // Pula o processamento do Android (HDR, etc) para ser mais rápido
            shutterSound: false,
          });

          if (photo?.base64) {
            ws.current.send(photo.base64);
          }
        } catch (err) {
          console.log("Erro ao capturar frame:", err);
        }
      }
    }, 200); // 200ms = 5 frames por segundo (Bom equilíbrio para TCC)
  };

  const stopStreaming = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stopTranslation = () => {
    stopStreaming();
    ws.current?.close();
  };

  // Mantem a ordem dos hooks estavel e conecta somente quando a camera estiver liberada.
  useEffect(() => {
    if (!permission?.granted) return;

    connectWebSocket();
    return () => {
      stopTranslation();
    };
  }, [permission?.granted]);

  // 1. Gerenciar Permissão da Câmera
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{textAlign:'center', marginBottom: 20}}>Precisamos da câmera para traduzir seus sinais.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Câmera em Tela Cheia */}
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="front" 
        ref={cameraRef}
      />

      {/* Camada de Interface (Overlay) */}
      <View style={styles.overlay}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.badgeText}>{isConnected ? 'IA ONLINE' : 'OFFLINE'}</Text>
          </View>
        </View>

        {/* Área de Tradução (Rodapé) */}
        <View style={styles.footer}>
          <Text style={styles.label}>Tradução em Tempo Real:</Text>
          <Text style={styles.translationText}>{translation}</Text>
          {confidence > 0 && (
            <Text style={styles.confidence}>Confiança: {(confidence * 100).toFixed(0)}%</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  header: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  footer: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 15, alignItems: 'center' },
  label: { color: '#ccc', marginBottom: 5 },
  translationText: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  confidence: { color: '#4CAF50', marginTop: 5, fontSize: 12 },
  btn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' }
});