import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Task } from '@/types/task';
import { colors } from '@/constants/colors';
import { Clock, CheckCircle2, Circle } from 'lucide-react-native';
import ProgressBar from './ProgressBar';
import { calculateTaskProgress, formatTime } from '@/utils/helpers';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onLongPress: () => void;
  onComplete?: (completed: boolean) => void;
}

const SWIPE_THRESHOLD = 80;

export default function TaskItem({ task, onPress, onLongPress, onComplete }: TaskItemProps) {
  const progress = calculateTaskProgress(task);
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(72);
  
  const handleComplete = async (completed: boolean) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptics not available');
      }
    }
    onComplete?.(completed);
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
    .failOffsetY([-15, 15]) // Cancel if vertical movement exceeds 15px
    .onUpdate((event) => {
      // Only allow right swipe and ensure it's primarily horizontal
      if (Math.abs(event.velocityY) > Math.abs(event.velocityX)) {
        return; // Prioritize vertical scrolling
      }
      
      const newTranslateX = Math.max(0, Math.min(event.translationX, SWIPE_THRESHOLD * 1.2));
      translateX.value = newTranslateX;
    })
    .onEnd((event) => {
      // Check if it's primarily a horizontal gesture
      if (Math.abs(event.velocityY) > Math.abs(event.velocityX)) {
        translateX.value = withSpring(0);
        return;
      }

      if (event.translationX >= SWIPE_THRESHOLD) {
        translateX.value = withSpring(SWIPE_THRESHOLD);
        if (!task.completed) {
          runOnJS(handleComplete)(true);
        }
      } else {
        translateX.value = withSpring(0);
      }
    })
    .onFinalize(() => {
      // Always reset position when gesture ends
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: itemHeight.value,
    backgroundColor: colors.success + '20',
    opacity: translateX.value / SWIPE_THRESHOLD,
    borderRadius: 12,
  }));

  // Get priority color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return colors.priorityHigh;
      case 'medium':
        return colors.priorityMedium;
      case 'low':
        return colors.priorityLow;
      case 'optional':
        return colors.priorityOptional;
      default:
        return colors.border;
    }
  };

  return (
    <View>
      <Animated.View style={backgroundStyle} />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.container, task.completed && styles.completedContainer, animatedStyle]}>
          <View style={[styles.priorityLine, { backgroundColor: getPriorityColor() }]} />
          
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => handleComplete(!task.completed)}
          >
            {task.completed ? (
              <CheckCircle2 size={20} color={colors.success} />
            ) : (
              <Circle size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.content}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
          >
            <View style={styles.header}>
              <Text 
                style={[
                  styles.title,
                  task.completed && styles.completedText
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </View>

            {task.category && (
              <View style={styles.categoryContainer}>
                <Text style={styles.category}>{task.category}</Text>
              </View>
            )}

            <View style={styles.footer}>
              <View style={styles.timeContainer}>
                <Clock size={16} color={colors.textLight} />
                <Text style={styles.time}>
                  {formatTime(task.estimatedMinutes)}
                </Text>
              </View>

              {task.subTasks.length > 0 && (
                <View style={styles.progressContainer}>
                  <ProgressBar progress={progress} />
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  completedContainer: {
    opacity: 0.7,
  },
  priorityLine: {
    width: 4,
    backgroundColor: colors.primary,
  },
  checkbox: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  categoryContainer: {
    backgroundColor: colors.categoryBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: colors.categoryText,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    marginLeft: 4,
    color: colors.textLight,
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  progressText: {
    marginLeft: 8,
    color: colors.textLight,
    fontSize: 12,
    minWidth: 35,
  },
});