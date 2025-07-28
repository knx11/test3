import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useTaskStore } from '@/store/taskStore';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import TaskItem from '@/components/TaskItem';
import TaskDetails from '@/components/TaskDetails';
import TaskForm from '@/components/TaskForm';
import { Settings, Plus } from 'lucide-react-native';

export default function CalendarScreen() {
  const router = useRouter();
  const { tasks } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);

  // Get week dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get tasks for selected date
  const tasksForDate = tasks.filter(task => {
    const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
    return isSameDay(taskDate, selectedDate);
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Calendar',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/settings')}
              style={styles.headerButton}
            >
              <Settings size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <View style={styles.calendar}>
          {weekDates.map((date) => (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dateButton,
                isSameDay(date, selectedDate) && styles.selectedDate,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dayText,
                isSameDay(date, selectedDate) && styles.selectedDateText
              ]}>
                {format(date, 'EEE')}
              </Text>
              <Text style={[
                styles.dateText,
                isSameDay(date, selectedDate) && styles.selectedDateText
              ]}>
                {format(date, 'd')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          style={styles.taskList}
          contentContainerStyle={styles.taskListContent}
        >
          {tasksForDate.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onPress={() => setSelectedTaskId(task.id)}
              onLongPress={() => {}}
            />
          ))}
          {tasksForDate.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks for this date</Text>
              <Text style={styles.emptySubtext}>Add a task using the + button below</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowAddTask(true)}
        >
          <Plus size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <TaskDetails
        visible={!!selectedTaskId}
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      <TaskForm
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        initialDate={selectedDate}
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
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
  },
  selectedDate: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedDateText: {
    color: colors.background,
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 34 : 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
});