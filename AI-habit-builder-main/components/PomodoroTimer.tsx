import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { ChevronLeft, ChevronRight, Edit3, Maximize2, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useTaskStore } from '@/store/taskStore';
import { SubTask } from '@/types/task';

type PomodoroStage = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSession {
  subTask: SubTask;
  duration: number; // in seconds
  completed: boolean;
}

interface PomodoroTimerProps {
  taskId: string;
}

export default function PomodoroTimer({ taskId }: PomodoroTimerProps) {
  const { tasks, pomodoroSettings, updateSubTask } = useTaskStore();
  
  const task = tasks.find(t => t.id === taskId);
  
  // Create sessions for each subtask
  const sessions: PomodoroSession[] = useMemo(() => {
    const incompletedSubTasks = task?.subTasks.filter(st => !st.completed) || [];
    return incompletedSubTasks.map(subTask => ({
      subTask,
      duration: subTask.estimatedMinutes * 60,
      completed: false
    }));
  }, [task?.subTasks]);
  
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState<PomodoroStage>('work');
  const [timeLeft, setTimeLeft] = useState(() => {
    if (sessions.length > 0) {
      return sessions[0].duration;
    }
    return pomodoroSettings.workDuration * 60;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleStageComplete = React.useCallback(() => {
    if (currentStage === 'work') {
      // Mark current subtask as completed
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && task) {
        updateSubTask(task.id, currentSession.subTask.id, {
          completed: true,
          actualMinutes: Math.ceil((currentSession.duration - timeLeft) / 60)
        });
      }
      
      setCompletedSessions(prev => prev + 1);
      
      // Determine break type
      const shouldTakeLongBreak = (completedSessions + 1) % pomodoroSettings.sessionsBeforeLongBreak === 0;
      const nextStage: PomodoroStage = shouldTakeLongBreak ? 'longBreak' : 'shortBreak';
      const breakDuration = shouldTakeLongBreak 
        ? pomodoroSettings.longBreakDuration * 60 
        : pomodoroSettings.shortBreakDuration * 60;
      
      setCurrentStage(nextStage);
      setTimeLeft(breakDuration);
      setIsRunning(true); // Auto-start break timer
    } else {
      // Break finished, move to next work session
      const nextSessionIndex = currentSessionIndex + 1;
      
      if (nextSessionIndex < sessions.length) {
        setCurrentSessionIndex(nextSessionIndex);
        setCurrentStage('work');
        setTimeLeft(sessions[nextSessionIndex].duration);
      } else {
        // All sessions completed
        setIsRunning(false);
        setCurrentStage('work');
        setCurrentSessionIndex(0);
        if (sessions.length > 0) {
          setTimeLeft(sessions[0].duration);
        }
      }
    }
  }, [currentStage, sessions, currentSessionIndex, task, updateSubTask, timeLeft, completedSessions, pomodoroSettings]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          setTotalTimeSpent(total => total + 1);
          return newTime;
        });
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer finished, move to next stage
      handleStageComplete();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, handleStageComplete]);



  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setCurrentSessionIndex(0);
    setCurrentStage('work');
    setIsRunning(false);
    setCompletedSessions(0);
    setTotalTimeSpent(0);
    if (sessions.length > 0) {
      setTimeLeft(sessions[0].duration);
    } else {
      setTimeLeft(pomodoroSettings.workDuration * 60);
    }
  };

  const markCurrentSubtaskDone = () => {
    if (currentStage === 'work') {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && task) {
        // Mark current subtask as completed
        updateSubTask(task.id, currentSession.subTask.id, {
          completed: true,
          actualMinutes: Math.ceil((currentSession.duration - timeLeft) / 60)
        });
        
        // Move to next session or break and auto-start break
        setIsRunning(false); // Stop current timer first
        handleStageComplete();
      }
    } else {
      // Skip break
      handleStageComplete();
    }
  };

  const handleTimeEdit = () => {
    const currentMinutes = Math.ceil(timeLeft / 60);
    setEditTimeValue(currentMinutes.toString());
    setIsEditingTime(true);
  };

  const saveTimeEdit = () => {
    const newMinutes = parseInt(editTimeValue);
    if (isNaN(newMinutes) || newMinutes <= 0) {
      Alert.alert('Invalid Time', 'Please enter a valid number of minutes.');
      return;
    }
    
    const newTimeInSeconds = newMinutes * 60;
    setTimeLeft(newTimeInSeconds);
    setIsEditingTime(false);
    setEditTimeValue('');
  };

  const cancelTimeEdit = () => {
    setIsEditingTime(false);
    setEditTimeValue('');
  };

  const goToPreviousSession = () => {
    if (currentSessionIndex > 0) {
      const prevSessionIndex = currentSessionIndex - 1;
      setCurrentSessionIndex(prevSessionIndex);
      setCurrentStage('work');
      setTimeLeft(sessions[prevSessionIndex].duration);
      setIsRunning(false);
    }
  };

  const goToNextSession = () => {
    if (currentSessionIndex < sessions.length - 1) {
      const nextSessionIndex = currentSessionIndex + 1;
      setCurrentSessionIndex(nextSessionIndex);
      setCurrentStage('work');
      setTimeLeft(sessions[nextSessionIndex].duration);
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStageText = () => {
    switch (currentStage) {
      case 'work':
        const currentSession = sessions[currentSessionIndex];
        return currentSession ? `Working on: ${currentSession.subTask.title}` : 'Work Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Work Time';
    }
  };

  const getStageColor = () => {
    switch (currentStage) {
      case 'work':
        return colors.primary;
      case 'shortBreak':
        return colors.success;
      case 'longBreak':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  if (!task || sessions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No subtasks available</Text>
          <Text style={styles.emptySubtext}>Add subtasks to start a Pomodoro session</Text>
        </View>
      </View>
    );
  }

  const renderTimerContent = (fullscreen = false) => (
    <View style={fullscreen ? styles.fullscreenContainer : styles.container}>
      {/* Compact Header */}
      <View style={[styles.compactHeader, fullscreen && styles.fullscreenProgressSection]}>
        <View style={styles.headerRow}>
          <Text style={[styles.progressText, fullscreen && styles.fullscreenProgressText]}>
            {currentSessionIndex + 1} of {sessions.length}
          </Text>
          <Text style={[styles.timeSpentText, fullscreen && styles.fullscreenTimeSpentText]}>
            Total: {formatTime(totalTimeSpent)}
          </Text>
          {!fullscreen && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setIsFullscreen(true)}
            >
              <Maximize2 size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Navigation Controls with Timer */}
      <View style={[styles.navigationContainer, fullscreen && styles.fullscreenNavigationContainer]}>
        <TouchableOpacity 
          style={[
            styles.navButton, 
            fullscreen && styles.fullscreenNavButton,
            currentSessionIndex === 0 && styles.navButtonDisabled
          ]} 
          onPress={goToPreviousSession}
          disabled={currentSessionIndex === 0}
        >
          <ChevronLeft 
            size={fullscreen ? 32 : 20} 
            color={currentSessionIndex === 0 ? colors.textLight : colors.text} 
          />
        </TouchableOpacity>

        {/* Timer Circle */}
        <View style={[styles.timerCircle, { borderColor: getStageColor() }, fullscreen && styles.fullscreenTimerCircle]}>
          {isEditingTime ? (
            <View style={[styles.editTimeContainer, fullscreen && styles.fullscreenEditTimeContainer]}>
              <TextInput
                style={[styles.timeInput, fullscreen && styles.fullscreenTimeInput]}
                value={editTimeValue}
                onChangeText={setEditTimeValue}
                keyboardType="numeric"
                placeholder="Minutes"
                placeholderTextColor={colors.textLight}
                autoFocus
              />
              <View style={styles.editTimeButtons}>
                <TouchableOpacity style={[styles.editTimeButton, fullscreen && styles.fullscreenEditTimeButton]} onPress={saveTimeEdit}>
                  <Text style={[styles.editTimeButtonText, fullscreen && styles.fullscreenEditTimeButtonText]}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editTimeButton, styles.cancelButton, fullscreen && styles.fullscreenEditTimeButton]} onPress={cancelTimeEdit}>
                  <Text style={[styles.editTimeButtonText, fullscreen && styles.fullscreenEditTimeButtonText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={handleTimeEdit} style={styles.timeContainer}>
                <Text style={[styles.timeText, fullscreen && styles.fullscreenTimeText]}>{formatTime(timeLeft)}</Text>
                <Edit3 size={fullscreen ? 20 : 14} color={colors.textLight} style={[styles.editIcon, fullscreen && styles.fullscreenEditIcon]} />
              </TouchableOpacity>
              <Text style={[styles.phaseText, { color: getStageColor() }, fullscreen && styles.fullscreenPhaseText]}>
                {getStageText()}
              </Text>
              {currentStage === 'work' && (
                <Text style={[styles.estimatedText, fullscreen && styles.fullscreenEstimatedText]}>
                  Est: {sessions[currentSessionIndex]?.subTask.estimatedMinutes}min
                </Text>
              )}
            </>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.navButton, 
            fullscreen && styles.fullscreenNavButton,
            currentSessionIndex === sessions.length - 1 && styles.navButtonDisabled
          ]} 
          onPress={goToNextSession}
          disabled={currentSessionIndex === sessions.length - 1}
        >
          <ChevronRight 
            size={fullscreen ? 32 : 20} 
            color={currentSessionIndex === sessions.length - 1 ? colors.textLight : colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={[styles.controls, fullscreen && styles.fullscreenControls]}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: getStageColor() }, fullscreen && styles.fullscreenButton]} 
          onPress={toggleTimer}
        >
          <Text style={[styles.buttonText, fullscreen && styles.fullscreenButtonText]}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.doneButton, fullscreen && styles.fullscreenButton]} 
          onPress={markCurrentSubtaskDone}
        >
          <Text style={[styles.buttonText, fullscreen && styles.fullscreenButtonText]}>
            {currentStage === 'work' ? 'Done' : 'Skip Break'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.resetButton, fullscreen && styles.fullscreenButton]} 
          onPress={resetTimer}
        >
          <Text style={[styles.buttonText, fullscreen && styles.fullscreenButtonText]}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.compactContainer}>
        {renderTimerContent(false)}
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <View style={styles.fullscreenModal}>
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsFullscreen(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.fullscreenScrollContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.fullscreenScrollContent}
          >
            {renderTimerContent(true)}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullscreenScrollContainer: {
    flex: 1,
  },
  fullscreenScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  expandButton: {
    padding: 4,
  },
  compactHeader: {
    width: '100%',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fullscreenProgressSection: {
    marginBottom: 40,
  },
  progressText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  fullscreenProgressText: {
    fontSize: 22,
    marginBottom: 6,
    fontWeight: '500',
  },
  fullscreenTimeSpentText: {
    fontSize: 18,
    fontWeight: '400',
  },
  timeSpentText: {
    fontSize: 12,
    color: colors.textLight,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullscreenTimerCircle: {
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 10,
    marginBottom: 60,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  timeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
  fullscreenTimeText: {
    fontSize: 72,
    fontWeight: '800',
  },
  phaseText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  fullscreenPhaseText: {
    fontSize: 24,
    marginTop: 16,
    fontWeight: '600',
  },
  estimatedText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  fullscreenEstimatedText: {
    fontSize: 18,
    marginTop: 8,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  fullscreenControls: {
    gap: 24,
    marginBottom: 0,
    marginTop: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fullscreenButton: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
    minWidth: 140,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButton: {
    backgroundColor: colors.success,
  },
  resetButton: {
    backgroundColor: colors.textLight,
  },
  buttonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullscreenButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
  },
  fullscreenNavigationContainer: {
    marginBottom: 50,
    width: '100%',
    paddingHorizontal: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fullscreenNavButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginHorizontal: 30,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    marginTop: 4,
    opacity: 0.6,
  },
  fullscreenEditIcon: {
    marginTop: 6,
    opacity: 0.7,
  },
  editTimeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  fullscreenEditTimeContainer: {
    width: '90%',
  },
  timeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 100,
    marginBottom: 20,
  },
  fullscreenTimeInput: {
    fontSize: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 140,
    marginBottom: 30,
    borderBottomWidth: 3,
  },
  editTimeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editTimeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  fullscreenEditTimeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: colors.textLight,
  },
  editTimeButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenEditTimeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});