import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Zap, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useTaskStore } from '@/store/taskStore';
import Button from '@/components/Button';
import { generateTaskBreakdown } from '@/services/aiService';
import * as Haptics from 'expo-haptics';
import TaskItem from './TaskItem';

interface TaskFormProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export default function TaskForm({ visible, onClose, initialDate }: TaskFormProps) {
  const { tasks, addTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const categories = ['Work', 'Personal', 'Health', 'Shopping', 'Other'];

  const handleSubmit = async () => {
    if (!title.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    const taskId = addTask({
      title: title.trim(),
      description: description.trim(),
      category,
      estimatedMinutes: parseInt(estimatedMinutes) || 30,
      dueDate: initialDate?.toISOString(),
    });

    resetForm();
    onClose();
    return taskId;
  };

  const handleGenerateAI = async () => {
    if (!title.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const result = await generateTaskBreakdown(title, description);
      setEstimatedMinutes(result.totalEstimatedMinutes.toString());
      
      const taskId = await handleSubmit();
      if (taskId) {
        // Add the generated subtasks
        result.subTasks.forEach((subTask) => {
          // Add each subtask
        });
      }
    } catch (error) {
      console.error('Error generating AI breakdown:', error);
      setAiError('Failed to generate task breakdown. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setEstimatedMinutes('30');
    setAiError(null);
    setSelectedTask(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTaskSelect = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category || '');
      setEstimatedMinutes(task.estimatedMinutes.toString());
      setSelectedTask(taskId);
    }
    setShowTaskSelection(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedTask ? 'Edit Task' : 'New Task'}
            </Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Task title"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Task description"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.selectedCategory,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.selectedCategoryText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Estimated Time (minutes)</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={estimatedMinutes}
                onChangeText={setEstimatedMinutes}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.aiSection}>
              <TouchableOpacity
                style={[styles.aiButton, isGeneratingAI && styles.disabledButton]}
                onPress={handleGenerateAI}
                disabled={isGeneratingAI || !title.trim()}
              >
                {isGeneratingAI ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Zap size={20} color={colors.primary} />
                    <Text style={styles.aiButtonText}>Generate with AI</Text>
                  </>
                )}
              </TouchableOpacity>

              {aiError && (
                <View style={styles.errorContainer}>
                  <AlertTriangle size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{aiError}</Text>
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <TouchableOpacity
                style={styles.selectTaskButton}
                onPress={() => setShowTaskSelection(true)}
              >
                <Text style={styles.selectTaskText}>
                  Select from existing tasks
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={selectedTask ? 'Update Task' : 'Create Task'}
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={!title.trim()}
            />
          </ScrollView>
        </View>

        <Modal
          visible={showTaskSelection}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTaskSelection(false)}
        >
          <View style={styles.taskSelectionModal}>
            <View style={styles.taskSelectionContent}>
              <View style={styles.taskSelectionHeader}>
                <Text style={styles.taskSelectionTitle}>Select a Task</Text>
                <TouchableOpacity onPress={() => setShowTaskSelection(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.taskList}>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => handleTaskSelect(task.id)}
                  >
                    <TaskItem
                      task={task}
                      onPress={() => handleTaskSelect(task.id)}
                      onLongPress={() => {}}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    width: 24,
  },
  form: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeInput: {
    width: '30%',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.categoryBackground,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.categoryText,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: colors.background,
  },
  aiSection: {
    marginBottom: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  aiButtonText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: colors.danger,
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 20,
  },
  selectTaskButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectTaskText: {
    color: colors.text,
    fontWeight: '500',
  },
  taskSelectionModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  taskSelectionContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  taskSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  taskSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  taskList: {
    maxHeight: '80%',
  },
});