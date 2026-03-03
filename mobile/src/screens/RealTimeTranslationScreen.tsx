import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

// --- CONFIGURAÇÃO ---
// ⚠️ IMPORTANTE: Troque pelo IP do seu Notebook (veja no ipconfig/ifconfig)
// Se estiver no emulador Android, use '10.0.2.2'. No celular físico, use o IP da rede (ex: 192.168.1.15)
const WS_URL = 'ws://192.168.10.71:8000/ws/predict'; 

export default function RealTimeTranslationScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isConnected, setIsConnected] = useState(false);
  const [translation, setTranslation] = useState("Aguardando sinal...");
  const [confidence, setConfidence] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);
  const ws = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Gerenciar Permissão da Câmera
  if (!permission) return <View />;
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

  // 2. Conectar no WebSocket (Python) ao abrir a tela
  useEffect(() => {
    connectWebSocket();
    return () => {
      stopTranslation(); // Limpa tudo ao sair da tela
    };
  }, []);

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
        console.log("❌ Erro no WebSocket:", e);
      };

      ws.current.onclose = () => {
        console.log("🔴 Desconectado");
        setIsConnected(false);
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