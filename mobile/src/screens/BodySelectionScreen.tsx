import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { RootStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

type Props = RootStackScreenProps<'BodySelection'>;

type PainPoint = {
  name: string;
  x: number;
  y: number;
  side: 'front' | 'back';
};

const PAIN_POINTS: PainPoint[] = [
  { name: 'Cabeça', x: 50, y: 8, side: 'front' },
  { name: 'Pescoço', x: 50, y: 15, side: 'front' },
  { name: 'Ombro Esquerdo', x: 38, y: 20, side: 'front' },
  { name: 'Ombro Direito', x: 62, y: 20, side: 'front' },
  { name: 'Peito', x: 50, y: 28, side: 'front' },
  { name: 'Abdomen', x: 50, y: 38, side: 'front' },
  { name: 'Quadril', x: 50, y: 50, side: 'front' },
  { name: 'Perna Esquerda', x: 44, y: 68, side: 'front' },
  { name: 'Perna Direita', x: 56, y: 68, side: 'front' },
  { name: 'Nuca', x: 50, y: 15, side: 'back' },
  { name: 'Costas Superior', x: 50, y: 28, side: 'back' },
  { name: 'Lombar', x: 50, y: 40, side: 'back' },
  { name: 'Glúteo Esquerdo', x: 44, y: 52, side: 'back' },
  { name: 'Glúteo Direito', x: 56, y: 52, side: 'back' },
  { name: 'Panturrilha Esquerda', x: 44, y: 72, side: 'back' },
  { name: 'Panturrilha Direita', x: 56, y: 72, side: 'back' },
];

export default function BodySelectionScreen({ route, navigation }: Props) {
  const { peso, altura } = route.params;
  const [selected, setSelected] = useState<string[]>([]);
  const [isBack, setIsBack] = useState(false);

  const pointsOnCurrentSide = useMemo(
    () => PAIN_POINTS.filter((p) => p.side === (isBack ? 'back' : 'front')),
    [isBack]
  );

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
        <TouchableOpacity onPress={() => setIsBack((v) => !v)} accessibilityLabel="Alternar frente e costas">
          <Ionicons name="sync-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.patientBadge}>
          <Text style={styles.patientBadgeText}>Peso: {peso || '--'} kg</Text>
          <Text style={styles.patientBadgeText}>Altura: {altura || '--'} m</Text>
          <Text style={styles.patientBadgeText}>Vista: {isBack ? 'Costas' : 'Frente'}</Text>
        </View>

        <View style={styles.bodyCanvas}>
          <View style={styles.bodyPlaceholder}>
            <Ionicons name={isBack ? 'body-outline' : 'accessibility-outline'} size={120} color="#9FB3C8" />
            <Text style={styles.bodyLabel}>{isBack ? 'VISTA COSTAS' : 'VISTA FRENTE'}</Text>
          </View>

          {pointsOnCurrentSide.map((point) => {
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
  bodyPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyLabel: { marginTop: 8, fontWeight: '700', color: '#5A7896' },
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
