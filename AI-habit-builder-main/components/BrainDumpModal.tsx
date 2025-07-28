import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Mic, Zap, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useTaskStore } from '@/store/taskStore';
import Button from '@/components/Button';
import * as Haptics from 'expo-haptics';
import { parseISO } from 'date-fns';
import useFeedback from '@/hooks/useFeedback';

interface BrainDumpModalProps {
  visible: boolean;
  onClose: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export default function BrainDumpModal({ visible, onClose }: BrainDumpModalProps) {
  const [thoughts, setThoughts] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { addTask } = useTaskStore();
  const { showFeedback } = useFeedback();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const makeRequest = async (retryCount = 0): Promise<any> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a task organization assistant. Analyze the user's brain dump and break it down into clear, actionable tasks.
              Extract any date-related information and set due dates accordingly.
              Look for keywords like "tomorrow", "next week", "on Friday", etc.
              Convert relative dates to ISO date strings based on current date.`
            },
            {
              role: 'user',
              content: `Please analyze this brain dump and organize it into tasks. For each task, provide:
              - A clear title
              - Estimated time in minutes
              - Priority (high, medium, low, or optional)
              - Due date if mentioned (in ISO format)
              - A more detailed description

${thoughts}

Format your response as a JSON array of tasks:
[
  {
    "title": "Task title",
    "description": "More detailed description",
    "estimatedMinutes": 30,
    "priority": "high",
    "dueDate": "2025-07-01T00:00:00.000Z" // Include only if date is mentioned
  }
]`
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return makeRequest(retryCount + 1);
      }
      throw error;
    }
  };

  const handleOrganize = async () => {
    if (!thoughts.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    setIsProcessing(true);
    setRetryCount(0);

    try {
      const data = await makeRequest();
      
      if (!data.completion) {
        throw new Error('Invalid AI response');
      }

      // Extract JSON from the completion text
      const jsonMatch = data.completion.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No task data found in response');
      }

      const tasks = JSON.parse(jsonMatch[0]);

      // Add each task to the store
      tasks.forEach((task: any) => {
        // Validate the date if present
        let dueDate = undefined;
        if (task.dueDate) {
          try {
            dueDate = parseISO(task.dueDate).toISOString();
          } catch (e) {
            console.warn('Invalid date format:', task.dueDate);
          }
        }

        addTask({
          title: task.title,
          description: task.description,
          estimatedMinutes: task.estimatedMinutes,
          priority: task.priority,
          dueDate,
          aiGenerated: true,
        });
      });

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showFeedback('Tasks created successfully!', 'success');

      // Close the modal
      onClose();
      setThoughts('');

    } catch (error) {
      console.error('Error organizing thoughts:', error);
      showFeedback('Failed to create tasks. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    // Voice recording functionality would go here
    setIsRecording(!isRecording);
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
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dump Your Thoughts</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.description}>
              Type out everything on your mind, including any deadlines or dates. I'll organize it into actionable tasks and add them to your calendar.
            </Text>

            <TextInput
              style={styles.input}
              value={thoughts}
              onChangeText={setThoughts}
              placeholder="Start typing what's on your mind... For example: I need to finish the project report by Friday, call mom for her birthday next Tuesday, schedule dentist appointment for next month..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, isRecording && styles.recordingButton]}
                onPress={toggleRecording}
              >
                <Mic size={20} color={isRecording ? colors.danger : colors.text} />
                <Text style={styles.actionButtonText}>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
              </TouchableOpacity>

              <Button
                title={isProcessing ? `Processing${retryCount > 0 ? ` (Retry ${retryCount}/${MAX_RETRIES})` : ''}` : 'Organize My Thoughts'}
                onPress={handleOrganize}
                disabled={!thoughts.trim() || isProcessing}
                loading={isProcessing}
                icon={<Zap size={20} color={colors.background} />}
                style={styles.organizeButton}
              />
            </View>

            <View style={styles.howItWorks}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>
                  Type everything on your mind, including any dates or deadlines
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>
                  Our AI analyzes your thoughts and organizes them into tasks
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>
                  Tasks with dates are automatically added to your calendar
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>
                  Review and edit tasks in your task list or calendar
                </Text>
              </View>
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
  body: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    lineHeight: 24,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordingButton: {
    backgroundColor: colors.danger + '10',
    borderColor: colors.danger,
  },
  actionButtonText: {
    marginLeft: 8,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  organizeButton: {
    marginTop: 8,
  },
  howItWorks: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: Platform.OS === 'ios' ? 34 : 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.background,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});