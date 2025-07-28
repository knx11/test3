import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';

interface ProgressBarProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  height = 4,
  backgroundColor = colors.border,
  progressColor = colors.primary,
  animated = true,
}: ProgressBarProps) {
  const progressWidth = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
      backgroundColor: progressColor,
    };
  });

  useEffect(() => {
    if (animated) {
      progressWidth.value = withSpring(progress, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      progressWidth.value = progress;
    }
  }, [progress, animated]);

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View
        style={[styles.progress, { height }, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 4,
  },
});