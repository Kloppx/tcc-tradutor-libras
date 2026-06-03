import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Image } from 'react-native';
import { RootStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

type Props = RootStackScreenProps<'BodySelection'>;

type PainPoint = {
  name: string;
  x: number;
  y: number;
};

const PAIN_POINTS: PainPoint[] = [
  { name: 'Cabeça', x: 50, y: 10 },
  { name: 'Braço Esquerdo', x: 28, y: 28 },
  { name: 'Braço Direito', x: 72, y: 28 },
  { name: 'Tórax', x: 50, y: 30 },
  { name: 'Perna Esquerda', x: 42, y: 70 },
  { name: 'Perna Direita', x: 58, y: 70 },
];

export default function BodySelectionScreen({ route, navigation }: Props) {
  const { peso, altura } = route.params;
  const [selected, setSelected] = useState<string[]>([]);

  const togglePoint = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]));
  };

  const handleConfirm = () => {
    Toast.show({
      type: 'success',
      text1: 'Mapeamento registrado',
      text2: selected.length > 0 ? `${selected.length} área(s) selecionada(s)` : 'Nenhuma área marcada',
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5276" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar para triagem">
          <Ionicons name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapeamento de Dor</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.patientBadge}>
          <Text style={styles.patientBadgeText}>Peso: {peso || '--'} kg</Text>
          <Text style={styles.patientBadgeText}>Altura: {altura || '--'} m</Text>
          <Text style={styles.patientBadgeText}>Vista: Frente</Text>
        </View>

        <View style={styles.bodyCanvas}>
          <Image
            source={require('../../assets/body_silhouette.png')}
            style={styles.bodyImage}
            resizeMode="contain"
            accessibilityLabel="Silhueta do corpo vista de frente"
          />

          <View style={styles.bodyLabelBadge} pointerEvents="none">
            <Text style={styles.bodyLabel}>VISTA FRENTE</Text>
          </View>

          {PAIN_POINTS.map((point) => {
            const active = selected.includes(point.name);
            return (
              <TouchableOpacity
                key={point.name}
                style={[
                  styles.point,
                  { left: `${point.x}%`, top: `${point.y}%` },
                  active && styles.pointActive,
                ]}
                onPress={() => togglePoint(point.name)}
                accessibilityRole="button"
                accessibilityLabel={`Marcar dor em ${point.name}`}
              />
            );
          })}
        </View>

        <View style={styles.selectedCard}>
          <Text style={styles.selectedTitle}>Áreas selecionadas</Text>
          {selected.length === 0 ? (
            <Text style={styles.selectedEmpty}>Nenhuma área selecionada.</Text>
          ) : (
            selected.map((item) => (
              <Text key={item} style={styles.selectedItem}>
                - {item}
              </Text>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>CONFIRMAR MAPEAMENTO</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C3E50' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1A5276',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  patientBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  patientBadgeText: { color: '#D6E3F0', fontSize: 14, marginBottom: 4 },
  bodyCanvas: {
    height: 420,
    borderRadius: 14,
    backgroundColor: '#F0F4F8',
    position: 'relative',
    marginBottom: 14,
    overflow: 'hidden',
  },
  bodyImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.92,
  },
  bodyLabelBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(28, 58, 89, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bodyLabel: { fontWeight: '700', color: '#fff', fontSize: 12 },
  point: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.45)',
    borderWidth: 2,
    borderColor: '#E74C3C',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  pointActive: {
    backgroundColor: '#E74C3C',
    borderColor: '#fff',
  },
  selectedCard: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  selectedTitle: { fontSize: 16, fontWeight: '700', color: '#1C3A59', marginBottom: 8 },
  selectedEmpty: { color: '#7F8C8D' },
  selectedItem: { color: '#2C3E50', marginBottom: 4 },
  confirmButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
