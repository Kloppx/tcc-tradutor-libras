import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoSource, VideoView, useVideoPlayer } from 'expo-video';

type Props = {
  title: string;
  description: string;
  videoSource: VideoSource;
};

type LibrasVideoPlayerProps = {
  title: string;
  videoSource: VideoSource;
};

function LibrasVideoPlayer({ title, videoSource }: LibrasVideoPlayerProps) {
  const player = useVideoPlayer(videoSource, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      nativeControls
      contentFit="contain"
      accessibilityLabel={`Vídeo em Libras: ${title}`}
    />
  );
}

export default function LibrasVideoButton({ title, description, videoSource }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Ver ${title} em Libras`}
        accessibilityHint="Abre um vídeo com a tradução deste conteúdo em Libras"
        hitSlop={8}
      >
        <Ionicons name="hand-left-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
            accessibilityLabel="Fechar vídeo em Libras"
          />

          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="hand-left-outline" size={26} color="#1E88E5" />
                <Text style={styles.modalTitle}>{title}</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={26} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={styles.videoContainer}>
              {visible && <LibrasVideoPlayer title={title} videoSource={videoSource} />}
            </View>
            <Text style={styles.videoDescription}>{description}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    flexShrink: 1,
    color: '#1C3A59',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 500,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#0F172A',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoDescription: {
    marginTop: 12,
    color: '#5A7896',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
