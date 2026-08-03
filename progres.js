import React from 'react';
import { View, Text, Modal, StyleSheet, Platform, Image } from 'react-native';
import assert from 'assert';

// Image Asset Reference
const MONOCHROME_ICON = require('./assets/monochrome_icon.png');

/**
 * Image-Slicing Progress Bar Component extracted from login.html
 * Features Image Slicing reveal using monochrome_icon.png & Cyber-Chef progress track
 */
export const ProgressBarModal = ({ visible, progress, stepText, title = "Standalone App Ready" }) => {
  if (typeof progress === 'number') {
    assert(progress >= 0 && progress <= 100, "Progress must be between 0 and 100");
  }

  const safeProgress = Math.min(100, Math.max(0, progress || 0));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.greetingBox}>
          
          {/* Image-Slicing Progress Badge (monochrome_icon.png) */}
          <View style={styles.sliceBadgeWrapper}>
            {/* Dimmed Background Image Layer */}
            <Image
              source={MONOCHROME_ICON}
              style={[styles.iconImageBase, { opacity: 0.25 }]}
              resizeMode="contain"
            />

            {/* Sliced Dynamic Fill Layer */}
            <View style={[styles.imageSliceContainer, { width: `${safeProgress}%` }]}>
              <Image
                source={MONOCHROME_ICON}
                style={[styles.iconImageFill, { tintColor: '#00e676' }]}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          
          {/* Progress Track (Extracted from login.html) */}
          <View style={styles.loaderSmall}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${safeProgress}%` }]} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.progressLabel}>PROGRESS</Text>
            <Text style={styles.progressPercent}>{safeProgress}%</Text>
          </View>

          {stepText ? (
            <Text style={styles.stepText}>{stepText}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const ICON_SIZE = 64;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.88)',
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
    borderColor: 'rgba(0, 230, 118, 0.3)',
    shadowColor: '#00e676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10
  },
  sliceBadgeWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconImageBase: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'absolute'
  },
  imageSliceContainer: {
    height: ICON_SIZE,
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden'
  },
  iconImageFill: {
    width: ICON_SIZE,
    height: ICON_SIZE
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
