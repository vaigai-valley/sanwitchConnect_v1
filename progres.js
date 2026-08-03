import React from 'react';
import { View, Text, Modal, StyleSheet, Platform } from 'react-native';
import { Smartphone } from 'lucide-react-native';
import assert from 'assert';

/**
 * Extracted Progress Bar Component from login.html
 * Styled with Cyber-Chef Linear Gradient (#00e676 -> #00bfa5) & Glassmorphism Overlay
 */
export const ProgressBarModal = ({ visible, progress, stepText, title = "Standalone App Ready" }) => {
  if (typeof progress === 'number') {
    assert(progress >= 0 && progress <= 100, "Progress must be between 0 and 100");
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.greetingBox}>
          <View style={styles.iconContainer}>
            <Smartphone size={28} color="#00e676" />
          </View>

          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.loaderSmall}>
            {/* Progress Track (Extracted from login.html) */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.progressLabel}>PROGRESS</Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>

          {stepText ? (
            <Text style={styles.stepText}>{stepText}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  greetingBox: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    shadowColor: '#00e676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00e676',
    marginBottom: 14
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16
  },
  loaderSmall: {
    marginTop: 4,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center'
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#222222',
    borderRadius: 10,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00e676',
    borderRadius: 10
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10
  },
  progressLabel: {
    fontSize: 11,
    color: '#00e676',
    fontWeight: '800',
    letterSpacing: 0.5
  },
  progressPercent: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  stepText: {
    fontSize: 12,
    color: '#00e676',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4
  }
});

export default ProgressBarModal;
