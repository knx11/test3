import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  runOnJS,
  SlideInUp,
  SlideOutUp
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';

interface FeedbackToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

export default function FeedbackToast({
  message,
  visible,
  onHide,
  duration = 3000,
  type = 'info',
}: FeedbackToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
      backgroundColor: getBackgroundColor(),
    };
  });

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 300 }, () => {
          runOnJS(onHide)();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, translateY, duration, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(300)}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  message: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});