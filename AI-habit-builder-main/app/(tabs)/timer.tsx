import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useTaskStore } from '@/store/taskStore';
import PomodoroTimer from '@/components/PomodoroTimer';
import TaskItem from '@/components/TaskItem';
import TaskDetails from '@/components/TaskDetails';
import FeedbackToast from '@/components/FeedbackToast';
import useFeedback from '@/hooks/useFeedback';

export default function TimerScreen() {
  const router = useRouter();
  const { tasks } = useTaskStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const { feedback, showFeedback, hideFeedback } = useFeedback();
  
  // Filter only incomplete tasks
  const activeTasks = tasks.filter((task) => !task.completed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const handleTaskPress = (taskId: string) => {
    setSelectedTaskId(taskId);
    showFeedback('Task selected for timer', 'info');
  };

  const handleTaskLongPress = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetails(true);
  };

  const handleCloseTaskDetails = () => {
    setShowTaskDetails(false);
    setSelectedTaskId(undefined);
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Timer',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerShadowVisible: false,
        }}
      />
      
      <View style={styles.content}>
        <View style={styles.timerSection}>
          <PomodoroTimer taskId={selectedTaskId} />
          
          {selectedTaskId && (
            <View style={styles.selectedTaskInfo}>
              <Text style={styles.selectedTaskLabel}>Working on:</Text>
              <Text style={styles.selectedTaskTitle}>
                {tasks.find(t => t.id === selectedTaskId)?.title || 'Unknown Task'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.taskListContainer}>
          <Text style={styles.sectionTitle}>Select a Task</Text>
          <FlatList
            data={activeTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.taskItemWrapper,
                selectedTaskId === item.id && styles.selectedTaskItem
              ]}>
                <TaskItem
                  task={item}
                  onPress={() => handleTaskPress(item.id)}
                  onLongPress={() => handleTaskLongPress(item.id)}
                />
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No active tasks</Text>
                <Text style={styles.emptySubtext}>Create a task to start using the timer</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
      
      <TaskDetails
        visible={showTaskDetails}
        taskId={selectedTaskId || null}
        onClose={handleCloseTaskDetails}
      />
      
      <FeedbackToast
        message={feedback.message}
        visible={feedback.visible}
        onHide={hideFeedback}
        type={feedback.type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timerSection: {
    marginBottom: 24,
  },
  selectedTaskInfo: {
    backgroundColor: colors.categoryBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  selectedTaskLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  selectedTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.categoryText,
  },
  taskListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  taskItemWrapper: {
    marginBottom: 8,
  },
  selectedTaskItem: {
    backgroundColor: colors.categoryBackground,
    borderRadius: 12,
    padding: 4,
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 14,
  },
});