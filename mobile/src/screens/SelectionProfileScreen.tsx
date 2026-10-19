import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';
import LibrasVideoButton from '../components/LibrasVideoButton';

type Props = RootStackScreenProps<'SelectionProfile'>;

export default function SelectionProfileScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Bem-vindo(a)!</Text>
            <LibrasVideoButton
              title="Bem-vindo(a)!"
              description="Mensagem de boas-vindas traduzida em Libras."
              videoSource={require('../../assets/videos/selection_profile/bem_vindo.mp4')}
            />
          </View>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Selecione como você quer usar o aplicativo.</Text>
            <LibrasVideoButton
              title="Selecione seu perfil"
              description="Orientação em Libras para escolher como usar o aplicativo."
              videoSource={require('../../assets/videos/selection_profile/escolhe_perfil.mp4')}
            />
          </View>
        </View>
        
        <View style={styles.content}>
          {/* Card Tradutor de Libras por IA (NOVO - GRAVAÇÃO DE VÍDEO) */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={[styles.card, styles.translatorCard]} 
              onPress={() => navigation.navigate('VideoTranslation')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Tradutor de Libras por Câmera"
              accessibilityHint="Gravar vídeo do sinal e traduzir com IA"
            >
              <View style={styles.translatorBadge}>
                <Ionicons name="sparkles" size={14} color="#fff" />
                <Text style={styles.translatorBadgeText}>NOVA IA (VÍDEO)</Text>
              </View>
              <Ionicons name="videocam" size={48} color="#0284C7" />
              <Text style={[styles.cardTitle, { color: '#0284C7' }]}>Tradutor Libras (Câmera)</Text>
              <Text style={styles.cardDesc}>Gravar sinal em vídeo e obter tradução instantânea.</Text>
            </TouchableOpacity>
          </View>

          {/* Card para Paciente */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => navigation.navigate('Recepcao')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sou paciente"
              accessibilityHint="Inicia o autoatendimento de triagem"
            >
              <Ionicons name="person-outline" size={46} color="#1E88E5" />
              <Text style={styles.cardTitle}>Sou Paciente</Text>
              <Text style={styles.cardDesc}>Iniciar autoatendimento para triagem.</Text>
            </TouchableOpacity>
            <View style={styles.cardLibrasButton}>
              <LibrasVideoButton
                title="Sou Paciente"
                description="Explicação em Libras sobre o acesso destinado ao paciente."
                videoSource={require('../../assets/videos/selection_profile/paciente.mp4')}
              />
            </View>
          </View>

          {/* Card para Profissional */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => navigation.navigate('Login')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sou profissional de saúde"
              accessibilityHint="Abre o login para acesso aos painéis clínicos"
            >
              <Ionicons name="medkit-outline" size={46} color="#388E3C" />
              <Text style={styles.cardTitle}>Sou Profissional de Saúde</Text>
              <Text style={styles.cardDesc}>Acessar o painel de gerenciamento.</Text>
            </TouchableOpacity>
            <View style={styles.cardLibrasButton}>
              <LibrasVideoButton
                title="Sou Profissional de Saúde"
                description="Explicação em Libras sobre o acesso destinado ao profissional de saúde."
                videoSource={require('../../assets/videos/selection_profile/profissional_saude.mp4')}
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F4F8',
  },
  scrollContent: {
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1C3A59',
    textAlign: 'center',
  },
  subtitle: {
    flexShrink: 1,
    fontSize: 16,
    color: '#5A7896',
    textAlign: 'center',
  },
  content: { 
    paddingHorizontal: 20, 
  },
  card: { 
    backgroundColor: '#fff', 
    paddingVertical: 24,
    paddingHorizontal: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  translatorCard: {
    borderColor: '#0284C7',
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  translatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  translatorBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 18,
  },
  cardLibrasButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333',
    marginTop: 10,
  },
  cardDesc: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 4,
    textAlign: 'center',
  },
});
