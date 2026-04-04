import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { Target } from 'lucide-react-native';
import { useAppStore } from "@/store/useAppStore";

const RadiusSelector = () => {
  const { radius, setRadius } = useAppStore();

  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <View style={styles.glow} />
      
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.labelGroup}>
          <View style={styles.iconBox}>
            <Target size={14} color="#5A2D82" />
          </View>
          <Text style={styles.labelText}>Rază de căutare</Text>
        </View>
        <View style={styles.valueBadge}>
          <Text style={styles.valueText}>{radius}</Text>
          <Text style={styles.unitText}>KM</Text>
        </View>
      </View>

      {/* Custom Styled Slider */}
      <View style={styles.sliderWrapper}>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={radius}
          onValueChange={(value) => setRadius(value)}
          minimumTrackTintColor="#5A2D82"
          maximumTrackTintColor="rgba(90, 45, 130, 0.08)"
          thumbTintColor="#F4C542"
        />
      </View>
      
      {/* Scale indicators */}
      <View style={styles.scaleContainer}>
        <Text style={styles.scaleText}>Aproape</Text>
        <View style={styles.scaleDivider} />
        <Text style={styles.scaleText}>20km</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 3 }
    })
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(244, 197, 66, 0.15)',
    borderRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(90, 45, 130, 0.05)',
  },
  labelText: {
    fontSize: 12,
    color: 'rgba(43, 43, 43, 0.6)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#5A2D82',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F4C542',
  },
  unitText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#F4C542',
    opacity: 0.8,
  },
  sliderWrapper: {
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  scaleText: {
    fontSize: 9,
    color: 'rgba(43, 43, 43, 0.3)',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scaleDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(43, 43, 43, 0.05)',
    marginHorizontal: 15,
  }
});

export default RadiusSelector;