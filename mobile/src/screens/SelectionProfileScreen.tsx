import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';
import LibrasVideoButton from '../components/LibrasVideoButton';

// Usando o tipo aninhado para obter a prop de navegação correta
type Props = RootStackScreenProps<'SelectionProfile'>;

export default function SelectionProfileScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
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
            <Ionicons name="person-outline" size={50} color="#1E88E5" />
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
            <Ionicons name="medkit-outline" size={50} color="#388E3C" />
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

        {/* <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('Main')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Modo demonstração"
          accessibilityHint="Abre o fluxo principal com abas de recursos"
        >
          <Ionicons name="apps-outline" size={24} color="#1C3A59" />
          <Text style={styles.secondaryCardText}>Modo demonstração do aplicativo</Text>
        </TouchableOpacity> */}

        {/* <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('GestaoProfissionais')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Gestão de profissionais"
          accessibilityHint="Abre a tela para cadastrar e administrar médicos e enfermeiros"
        >
          <Ionicons name="people-outline" size={24} color="#1C3A59" />
          <Text style={styles.secondaryCardText}>Gestão da clínica (cadastro da equipe)</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginTop: 12,
    paddingHorizontal: 8,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#1C3A59',
    textAlign: 'center',
  },
  subtitle: {
    flexShrink: 1,
    fontSize: 18,
    color: '#5A7896',
    textAlign: 'center',
  },
  content: { 
    paddingHorizontal: 20, 
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 30, 
    borderRadius: 20, 
    alignItems: 'center',
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // Sombra para Android
    elevation: 8,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 25,
  },
  cardLibrasButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  cardTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#333',
    marginTop: 15,
  },
  cardDesc: { 
    fontSize: 15, 
    color: '#666', 
    marginTop: 5,
    textAlign: 'center',
  },
  secondaryCard: {
    backgroundColor: '#EAF2F8',
    borderWidth: 1,
    borderColor: '#B8CCE0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryCardText: {
    color: '#1C3A59',
    fontWeight: '600',
  },
});
