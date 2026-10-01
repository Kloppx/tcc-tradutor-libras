import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { predictVideo, PredictVideoResult, API_BASE_URL } from '../services/api';

const VOCABULARY = [
  'curar',
  'doença',
  'dor',
  'hospital',
  'posto de saúde',
  'ppa',
  'remédio',
  'saúde',
  'sus',
  'ubs',
];

export default function VideoTranslationScreen() {
  const navigation = useNavigation<any>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<PredictVideoResult | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const serverLabel = API_BASE_URL.replace(/^https?:\/\//, '');

  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording || isAnalyzing) return;

    setPrediction(null);
    setIsRecording(true);
    setCountdown(3);

    let timeLeft = 3;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setCountdown(0);
      } else {
        setCountdown(timeLeft);
      }
    }, 1000);

    try {
      console.log('Iniciando gravação de vídeo de 3 segundos...');
      const recordPromise = cameraRef.current.recordAsync({
        maxDuration: 3,
      });

      const video = await recordPromise;

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setIsRecording(false);

      if (video?.uri) {
        console.log('Vídeo gravado em:', video.uri);
        await analyzeVideo(video.uri);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Gravação cancelada',
          text2: 'Nenhum vídeo registrado.',
        });
      }
    } catch (err: any) {
      console.error('Erro na gravação de vídeo:', err);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setIsRecording(false);
      Toast.show({
        type: 'error',
        text1: 'Erro na gravação',
        text2: err?.message || 'Falha ao registrar vídeo.',
      });
    }
  };

  const stopRecordingManually = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    try {
      cameraRef.current?.stopRecording();
    } catch (e) {
      console.log('Erro ao parar gravação:', e);
    }
  };

  const analyzeVideo = async (uri: string) => {
    setIsAnalyzing(true);
    try {
      console.log('Enviando vídeo para o backend...');
      const result = await predictVideo(uri);
      console.log('Resultado da predição:', result);
      setPrediction(result);
      setServerOnline(true);

      if (result.status === 'predicted') {
        Toast.show({
          type: 'success',
          text1: 'Tradução Concluída!',
          text2: `Sinal identificado: ${result.word?.toUpperCase()}`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Não identificado',
          text2: result.message || 'Tente gravar o sinal mais perto da câmera.',
        });
      }
    } catch (err: any) {
      console.error('Erro ao analisar vídeo:', err);
      checkServerHealth();
      Toast.show({
        type: 'error',
        text1: 'Falha no envio do vídeo',
        text2: err?.message || `Verifique se o backend Python está ativo em ${serverLabel}.`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!cameraPermission) return <View style={styles.container} />;

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color="#0284C7" />
        <Text style={styles.permissionTitle}>Permissão de Câmera Necessária</Text>
        <Text style={styles.permissionDesc}>
          Precisamos acessar a câmera frontal para gravar e traduzir seus gestos em Libras.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestCameraPermission}>
          <Text style={styles.primaryBtnText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="video"
        mute={true}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SelectionProfile')}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Tradutor de Libras</Text>
            <TouchableOpacity onPress={checkServerHealth} style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      serverOnline === true
                        ? '#4CAF50'
                        : serverOnline === false
                        ? '#F44336'
                        : '#FF9800',
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {serverOnline === true
                  ? 'IA ONLINE'
                  : serverOnline === false
                  ? 'IA OFFLINE'
                  : 'Verificando'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={checkServerHealth}
            accessibilityLabel="Atualizar status"
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Guia de enquadramento pontilhado */}
        {!prediction && !isAnalyzing && (
          <View style={styles.guideContainer} pointerEvents="none">
            <View style={[styles.guideBox, isRecording && styles.guideBoxRecording]}>
              <Text style={styles.guideText}>
                {isRecording
                  ? `Gravando sinal... ${countdown}s`
                  : 'Enquadre tronco e mãos no quadro'}
              </Text>
            </View>
          </View>
        )}

        {/* Analisando */}
        {isAnalyzing && (
          <View style={styles.cardContainer}>
            <View style={styles.analyzingCard}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={styles.analyzingTitle}>Analisando sinal em Libras...</Text>
              <Text style={styles.analyzingSubtitle}>
                A Inteligência Artificial está processando os 45 frames de pose e mãos.
              </Text>
            </View>
          </View>
        )}

        {/* Resultado */}
        {prediction && !isAnalyzing && (
          <View style={styles.cardContainer}>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name={prediction.status === 'predicted' ? 'checkmark-circle' : 'alert-circle'}
                  size={28}
                  color={prediction.status === 'predicted' ? '#16A34A' : '#DC2626'}
                />
                <Text style={styles.resultHeaderTitle}>
                  {prediction.status === 'predicted' ? 'Sinal Reconhecido' : 'Resultado'}
                </Text>
              </View>

              {prediction.status === 'predicted' && prediction.word ? (
                <>
                  <Text style={styles.resultWord}>{prediction.word.toUpperCase()}</Text>

                  {typeof prediction.confidence === 'number' && (
                    <View style={styles.confidenceSection}>
                      <View style={styles.confidenceRow}>
                        <Text style={styles.confidenceLabel}>Confiança</Text>
                        <Text style={styles.confidenceValue}>
                          {(prediction.confidence * 100).toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(100, Math.round(prediction.confidence * 100))}%`,
                              backgroundColor:
                                prediction.confidence >= 0.7
                                  ? '#16A34A'
                                  : prediction.confidence >= 0.4
                                  ? '#F59E0B'
                                  : '#EF4444',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  {prediction.top3 && prediction.top3.length > 1 && (
                    <View style={styles.top3Section}>
                      <Text style={styles.top3Title}>Outras possibilidades:</Text>
                      <View style={styles.top3Row}>
                        {prediction.top3.slice(1, 3).map((item: { word: string; confidence: number }, idx: number) => (
                          <View key={idx} style={styles.top3Chip}>
                            <Text style={styles.top3ChipText}>
                              {item.word}: {(item.confidence * 100).toFixed(0)}%
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.errorText}>
                  {prediction.message || 'Não foi possível reconhecer o sinal.'}
                </Text>
              )}

              <TouchableOpacity
                style={styles.recordAgainBtn}
                onPress={() => setPrediction(null)}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.recordAgainBtnText}>Gravar Outro Sinal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rodapé / Controles */}
        {!prediction && !isAnalyzing && (
          <View style={styles.bottomControls}>
            <View style={styles.vocabContainer}>
              <Text style={styles.vocabTitle}>Sinais Treinados (10 palavras):</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vocabScroll}
              >
                {VOCABULARY.map((palavra) => (
                  <View key={palavra} style={styles.vocabTag}>
                    <Text style={styles.vocabTagText}>{palavra}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.recordBtnWrapper}>
              {isRecording ? (
                <TouchableOpacity
                  style={styles.recordingBtnActive}
                  onPress={stopRecordingManually}
                  accessibilityLabel="Parar Gravação"
                >
                  <View style={styles.recordingStopSquare} />
                  <Text style={styles.recordingCountdownText}>{countdown}s</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.recordBtn}
                  onPress={startRecording}
                  accessibilityLabel="Gravar Vídeo de 3 segundos"
                >
                  <View style={styles.recordBtnInner}>
                    <Ionicons name="videocam" size={28} color="#fff" />
                  </View>
                  <Text style={styles.recordBtnLabel}>GRAVAR SINAL (3s)</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.instructionsText}>
              Toque no botão e execute o sinal durante os 3 segundos.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  guideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  guideBox: {
    width: '90%',
    height: 280,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  guideBoxRecording: {
    borderColor: '#EF4444',
    borderStyle: 'solid',
    borderWidth: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  guideText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  vocabContainer: { width: '100%', marginBottom: 16 },
  vocabTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  vocabScroll: { gap: 6, paddingHorizontal: 4 },
  vocabTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vocabTagText: { color: '#E2E8F0', fontSize: 12, fontWeight: '500' },
  recordBtnWrapper: { marginVertical: 8, alignItems: 'center' },
  recordBtn: { alignItems: 'center', gap: 8 },
  recordBtnInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0284C7',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  recordBtnLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  recordingBtnActive: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DC2626',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  recordingStopSquare: {
    width: 18,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  recordingCountdownText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  instructionsText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  cardContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  analyzingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 6,
  },
  analyzingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 14,
  },
  analyzingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  resultHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  resultWord: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0284C7',
    textAlign: 'center',
    marginVertical: 4,
  },
  confidenceSection: {
    width: '100%',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confidenceLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  confidenceValue: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  top3Section: { width: '100%', marginTop: 12 },
  top3Title: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  top3Row: { flexDirection: 'row', gap: 8 },
  top3Chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  top3ChipText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  errorText: {
    color: '#DC2626',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 12,
  },
  recordAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  recordAgainBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
