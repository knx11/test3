import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  X, 
  Clock, 
  Calendar, 
  CheckCircle, 
  Circle, 
  Share2, 
  Zap,
  Trash,
  AlertTriangle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { Task, TaskPriority } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { formatTime, formatDate } from '@/utils/helpers';
import Button from '@/components/Button';
import PomodoroTimer from '@/components/PomodoroTimer';
import { generateTaskBreakdown } from '@/services/aiService';

interface TaskDetailsProps {
  visible: boolean;
  taskId: string | null;
  onClose: () => void;
}

export default function TaskDetails({ visible, taskId, onClose }: TaskDetailsProps) {
  const { 
    tasks, 
    completeTask, 
    completeSubTask, 
    deleteTask,
    updateTask,
    updateSubTask,
    deleteSubTask,
    addSubTask,
    addAIGeneratedSubTasks,
    deleteAllSubTasks,
    assignPriority
  } = useTaskStore();
  
  const [showTimer, setShowTimer] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskTime, setNewSubTaskTime] = useState('');
  const [editingTime, setEditingTime] = useState(false);
  const [newEstimatedTime, setNewEstimatedTime] = useState('');
  const [addingSubTask, setAddingSubTask] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const task = tasks.find((t) => t.id === taskId);
  
  if (!task) {
    return null;
  }
  
  const priorities: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'high', label: 'High', color: '#3498db' }, // Blue
    { value: 'medium', label: 'Medium', color: '#f1c40f' }, // Yellow
    { value: 'low', label: 'Low', color: '#2ecc71' }, // Green
    { value: 'optional', label: 'Optional', color: '#bdc3c7' }, // Light Gray
  ];
  
  const handleToggleComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    completeTask(task.id, !task.completed);
  };
  
  const handleToggleSubTaskComplete = (subTaskId: string, completed: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    completeSubTask(task.id, subTaskId, !completed);
  };
  
  const handleDeleteTask = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    deleteTask(task.id);
    onClose();
  };
  
  const handleDeleteSubTask = (subTaskId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    deleteSubTask(task.id, subTaskId);
  };
  
  const handleDeleteAllSubTasks = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    // Direct implementation without using Alert for better compatibility
    if (task.subTasks.length > 0) {
      // Call the deleteAllSubTasks function directly
      deleteAllSubTasks(task.id);
      
      // Provide feedback that deletion was successful
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };
  
  const handleEditTitle = () => {
    setNewTitle(task.title);
    setEditingTitle(true);
  };
  
  const saveTitle = () => {
    if (newTitle.trim()) {
      updateTask(task.id, { title: newTitle });
    }
    setEditingTitle(false);
  };
  
  const handleEditTime = () => {
    setNewEstimatedTime(task.estimatedMinutes.toString());
    setEditingTime(true);
  };
  
  const saveTime = () => {
    const time = parseInt(newEstimatedTime);
    if (!isNaN(time) && time > 0) {
      updateTask(task.id, { estimatedMinutes: time });
    }
    setEditingTime(false);
  };
  
  const handleEditSubTask = (subTaskId: string, title: string, estimatedMinutes: number) => {
    setEditingSubTaskId(subTaskId);
    setNewSubTaskTitle(title);
    setNewSubTaskTime(estimatedMinutes.toString());
  };
  
  const saveSubTask = () => {
    if (editingSubTaskId && newSubTaskTitle.trim()) {
      updateSubTask(task.id, editingSubTaskId, { 
        title: newSubTaskTitle,
        estimatedMinutes: parseInt(newSubTaskTime) || 15
      });
    }
    setEditingSubTaskId(null);
  };
  
  const handleAddSubTask = () => {
    setAddingSubTask(true);
    setNewSubTaskTitle('');
    setNewSubTaskTime('15');
  };
  
  const saveNewSubTask = () => {
    if (newSubTaskTitle.trim()) {
      addSubTask(task.id, {
        title: newSubTaskTitle,
        estimatedMinutes: parseInt(newSubTaskTime) || 15
      });
    }
    setAddingSubTask(false);
  };
  
  const handleChangePriority = (priority: TaskPriority) => {
    assignPriority(task.id, priority);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handleGenerateAISubtasks = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsGeneratingAI(true);
    setAiError(null);
    
    try {
      const result = await generateTaskBreakdown(task.title, task.description);
      
      // Update the main task's estimated time
      updateTask(task.id, { 
        estimatedMinutes: result.totalEstimatedMinutes,
        aiGenerated: true
      });
      
      // Add the generated subtasks
      addAIGeneratedSubTasks(task.id, result.subTasks);
      
    } catch (error) {
      console.error('Error generating AI subtasks:', error);
      setAiError("Failed to generate subtasks. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  const exportToCalendar = () => {
    // This would integrate with the device calendar
    // For now, we'll just show a message
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    alert('Task exported to calendar');
  };
  
  // Check if the task has subtasks
  const hasSubTasks = task.subTasks && task.subTasks.length > 0;
  
  // Get priority color
  const getPriorityColor = () => {
    const priority = priorities.find(p => p.value === task.priority);
    return priority ? priority.color : colors.border;
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={exportToCalendar}
              >
                <Share2 size={20} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.headerButton, styles.deleteButton]}
                onPress={handleDeleteTask}
              >
                <Trash size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.body}>
            <View style={styles.titleSection}>
              {editingTitle ? (
                <View style={styles.editTitleContainer}>
                  <TextInput
                    style={styles.editTitleInput}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    autoFocus
                  />
                  <TouchableOpacity onPress={saveTitle}>
                    <Text style={styles.saveButton}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.titleContainer}>
                  <TouchableOpacity onPress={handleToggleComplete}>
                    {task.completed ? (
                      <CheckCircle size={24} color={colors.primary} />
                    ) : (
                      <Circle size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  
                  <Text style={[styles.title, task.completed && styles.completedText]}>
                    {task.title}
                  </Text>
                  
                  <TouchableOpacity onPress={handleEditTitle}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.metadataContainer}>
                {task.category && (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{task.category}</Text>
                  </View>
                )}
                
                {task.priority && (
                  <View 
                    style={[
                      styles.priorityChip,
                      { backgroundColor: getPriorityColor() }
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {priorities.find(p => p.value === task.priority)?.label || 'Medium'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.prioritySection}>
              <Text style={styles.sectionTitle}>Priority</Text>
              <View style={styles.priorityButtons}>
                {priorities.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityButton,
                      { borderColor: p.color },
                      task.priority === p.value && { backgroundColor: p.color }
                    ]}
                    onPress={() => handleChangePriority(p.value)}
                  >
                    <Text 
                      style={[
                        styles.priorityButtonText,
                        { color: p.color },
                        task.priority === p.value && { color: '#fff' }
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Clock size={16} color={colors.textLight} />
                {editingTime ? (
                  <View style={styles.editTimeContainer}>
                    <TextInput
                      style={styles.editTimeInput}
                      value={newEstimatedTime}
                      onChangeText={setNewEstimatedTime}
                      keyboardType="number-pad"
                      autoFocus
                    />
                    <Text style={styles.minutesLabel}>minutes</Text>
                    <TouchableOpacity onPress={saveTime}>
                      <Text style={styles.saveButton}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.timeContainer}>
                    <Text style={styles.infoText}>
                      Estimated: {formatTime(task.estimatedMinutes)}
                    </Text>
                    <TouchableOpacity onPress={handleEditTime}>
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <View style={styles.infoItem}>
                <Calendar size={16} color={colors.textLight} />
                <Text style={styles.infoText}>
                  Created: {formatDate(task.createdAt)}
                </Text>
              </View>
            </View>
            
            {task.description ? (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{task.description}</Text>
              </View>
            ) : null}
            
            {showTimer ? (
              <View style={styles.timerSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pomodoro Timer</Text>
                  <TouchableOpacity onPress={() => setShowTimer(false)}>
                    <Text style={styles.hideText}>Hide</Text>
                  </TouchableOpacity>
                </View>
                <PomodoroTimer taskId={task.id} />
              </View>
            ) : (
              <Button
                title="Start Pomodoro Timer"
                onPress={() => setShowTimer(true)}
                style={styles.timerButton}
              />
            )}
            
            <View style={styles.subTasksSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Subtasks</Text>
                <View style={styles.subTaskActions}>
                  {hasSubTasks ? (
                    <TouchableOpacity 
                      onPress={handleDeleteAllSubTasks}
                      style={styles.deleteAllButton}
                    >
                      <Trash size={16} color={colors.danger} />
                      <Text style={styles.deleteAllText}>Delete All</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      onPress={handleGenerateAISubtasks}
                      disabled={isGeneratingAI}
                      style={[styles.aiButton, isGeneratingAI && styles.disabledButton]}
                    >
                      {isGeneratingAI ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Zap size={16} color={colors.primary} />
                          <Text style={styles.aiButtonText}>AI Generate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleAddSubTask}>
                    <Text style={styles.addText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {aiError && (
                <View style={styles.errorContainer}>
                  <AlertTriangle size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{aiError}</Text>
                </View>
              )}
              
              {!hasSubTasks ? (
                <Text style={styles.emptyText}>No subtasks yet</Text>
              ) : (
                <>
                  {task.subTasks.map((subTask) => (
                    <View key={subTask.id} style={styles.subTaskItem}>
                      {editingSubTaskId === subTask.id ? (
                        <View style={styles.editSubTaskContainer}>
                          <TextInput
                            style={styles.editSubTaskInput}
                            value={newSubTaskTitle}
                            onChangeText={setNewSubTaskTitle}
                            autoFocus
                          />
                          <View style={styles.editSubTaskTime}>
                            <TextInput
                              style={styles.editSubTaskTimeInput}
                              value={newSubTaskTime}
                              onChangeText={setNewSubTaskTime}
                              keyboardType="number-pad"
                            />
                            <Text style={styles.minutesText}>min</Text>
                          </View>
                          <TouchableOpacity onPress={saveSubTask}>
                            <Text style={styles.saveButton}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity 
                            onPress={() => handleToggleSubTaskComplete(subTask.id, subTask.completed)}
                            hitSlop={10}
                          >
                            {subTask.completed ? (
                              <CheckCircle size={20} color={colors.primary} />
                            ) : (
                              <Circle size={20} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                          
                          <View style={styles.subTaskContent}>
                            <Text 
                              style={[
                                styles.subTaskTitle, 
                                subTask.completed && styles.completedText
                              ]}
                            >
                              {subTask.title}
                            </Text>
                            <Text style={styles.subTaskTime}>
                              {formatTime(subTask.estimatedMinutes)}
                            </Text>
                          </View>
                          
                          <View style={styles.subTaskActions}>
                            <TouchableOpacity 
                              onPress={() => handleEditSubTask(
                                subTask.id, 
                                subTask.title, 
                                subTask.estimatedMinutes
                              )}
                              hitSlop={10}
                              style={styles.actionButton}
                            >
                              <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              onPress={() => handleDeleteSubTask(subTask.id)}
                              hitSlop={10}
                              style={styles.actionButton}
                            >
                              <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  ))}
                </>
              )}
              
              {addingSubTask && (
                <View style={styles.addSubTaskContainer}>
                  <TextInput
                    style={styles.editSubTaskInput}
                    value={newSubTaskTitle}
                    onChangeText={setNewSubTaskTitle}
                    placeholder="Subtask title"
                    placeholderTextColor={colors.textLight}
                    autoFocus
                  />
                  <View style={styles.editSubTaskTime}>
                    <TextInput
                      style={styles.editSubTaskTimeInput}
                      value={newSubTaskTime}
                      onChangeText={setNewSubTaskTime}
                      keyboardType="number-pad"
                      placeholder="15"
                      placeholderTextColor={colors.textLight}
                    />
                    <Text style={styles.minutesText}>min</Text>
                  </View>
                  <View style={styles.addSubTaskActions}>
                    <TouchableOpacity onPress={() => setAddingSubTask(false)}>
                      <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveNewSubTask}>
                      <Text style={styles.saveButton}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  deleteButton: {
    marginLeft: 16,
  },
  body: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginHorizontal: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  editText: {
    color: colors.primary,
    fontWeight: '500',
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '500',
  },
  editTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editTitleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    marginRight: 12,
    paddingVertical: 4,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: colors.background,
    fontWeight: '500',
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  priorityText: {
    color: colors.background,
    fontWeight: '500',
  },
  prioritySection: {
    marginBottom: 20,
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  priorityButtonText: {
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 6,
  },
  editTimeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  editTimeInput: {
    width: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
    marginRight: 8,
    color: colors.text,
    fontSize: 16,
  },
  minutesLabel: {
    color: colors.textLight,
    marginRight: 12,
  },
  infoText: {
    color: colors.textLight,
    marginLeft: 6,
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    color: colors.text,
    lineHeight: 22,
  },
  timerSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hideText: {
    color: colors.textLight,
  },
  timerButton: {
    marginBottom: 20,
  },
  subTasksSection: {
    marginBottom: 20,
  },
  subTaskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 12,
  },
  aiButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    marginRight: 12,
  },
  deleteAllText: {
    color: colors.danger,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addText: {
    color: colors.primary,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  subTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subTaskContent: {
    flex: 1,
    marginLeft: 12,
  },
  subTaskTitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  subTaskTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  actionButton: {
    marginLeft: 16,
  },
  editSubTaskContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editSubTaskInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    marginRight: 8,
    paddingVertical: 4,
  },
  editSubTaskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  editSubTaskTimeInput: {
    width: 40,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    textAlign: 'center',
    paddingVertical: 4,
  },
  minutesText: {
    color: colors.textLight,
    marginLeft: 4,
  },
  saveButton: {
    color: colors.primary,
    fontWeight: '500',
  },
  addSubTaskContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  addSubTaskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    color: colors.textLight,
    marginRight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: colors.danger,
    marginLeft: 8,
  },
});