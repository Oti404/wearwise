import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { X, Heart } from 'lucide-react-native';

interface SwipeButtonsProps {
  onLike: () => void;
  onSkip: () => void;
  swipeAnim?: Animated.Value;
}

const SwipeButtons = ({ onLike, onSkip, swipeAnim }: SwipeButtonsProps) => {
  // Interpolations for Skip (Left Swipe)
  const skipScale = swipeAnim 
    ? swipeAnim.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0],
        outputRange: [1.3, 1],
        extrapolate: 'clamp',
      })
    : 1;

  const skipRotate = swipeAnim
    ? swipeAnim.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0],
        outputRange: ['15deg', '0deg'],
        extrapolate: 'clamp',
      })
    : '0deg';

  const skipTranslateY = swipeAnim
    ? swipeAnim.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0],
        outputRange: [-10, 0],
        extrapolate: 'clamp',
      })
    : 0;

  // Interpolations for Want (Right Swipe)
  const likeScale = swipeAnim
    ? swipeAnim.interpolate({
        inputRange: [0, SCREEN_WIDTH / 2],
        outputRange: [1, 1.3],
        extrapolate: 'clamp',
      })
    : 1;

  const likeRotate = swipeAnim
    ? swipeAnim.interpolate({
        inputRange: [0, SCREEN_WIDTH / 2],
        outputRange: ['0deg', '-15deg'],
        extrapolate: 'clamp',
      })
    : '0deg';

  const likeTranslateY = swipeAnim
    ? swipeAnim.interpolate({
        inputRange: [0, SCREEN_WIDTH / 2],
        outputRange: [0, -10],
        extrapolate: 'clamp',
      })
    : 0;

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity onPress={onSkip} activeOpacity={0.85}>
        <Animated.View style={[styles.btn, styles.skipBtn, { transform: [{ scale: skipScale }, { rotate: skipRotate }, { translateY: skipTranslateY }] }]}>
          <X size={30} color="#FF4B4B" strokeWidth={3} />
        </Animated.View>
      </TouchableOpacity>

      {/* Want Button */}
      <TouchableOpacity onPress={onLike} activeOpacity={0.85}>
        <Animated.View style={[styles.btn, styles.wantBtn, { transform: [{ scale: likeScale }, { rotate: likeRotate }, { translateY: likeTranslateY }] }]}>
          <Heart size={30} color="#F4C542" fill="#F4C542" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default SwipeButtons;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
    }),
  },
  skipBtn: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 75, 75, 0.25)',
    shadowColor: '#FF4B4B',
  },
  wantBtn: {
    backgroundColor: '#5A2D82',
    borderWidth: 2,
    borderColor: '#7D3FB5',
    shadowColor: '#5A2D82',
  },
});