import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, SubTask, DailyStats, PomodoroSettings, TaskPriority } from '@/types/task';
import { generateUniqueId } from '@/utils/helpers';

interface TaskStore {
  tasks: Task[];
  dailyStats: DailyStats[];
  pomodoroSettings: PomodoroSettings;
  
  // Task Actions
  addTask: (task: Partial<Task>) => string;
  completeTask: (id: string, completed: boolean) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  
  // SubTask Actions
  addSubTask: (taskId: string, subTask: Partial<SubTask>) => void;
  completeSubTask: (taskId: string, subTaskId: string, completed: boolean) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  updateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  deleteAllSubTasks: (taskId: string) => void;
  addAIGeneratedSubTasks: (taskId: string, subTasks: Array<{ title: string; estimatedMinutes: number }>) => void;
  
  // Stats Actions
  addDailyStats: (stats: DailyStats) => void;
  
  // Settings Actions
  updatePomodoroSettings: (settings: PomodoroSettings) => void;
  
  // Priority Actions
  assignPriority: (taskId: string, priority: TaskPriority) => void;
  autoAssignPriorities: () => void;
}

const defaultPomodoroSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

// Priority weights for sorting
const priorityWeights: Record<TaskPriority, number> = {
  high: 4,
  medium: 3,
  low: 2,
  optional: 1,
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      dailyStats: [],
      pomodoroSettings: defaultPomodoroSettings,

      addTask: (task) => {
        const id = generateUniqueId();
        const newTask: Task = {
          id,
          title: task.title || '',
          description: task.description || '',
          createdAt: new Date().toISOString(),
          completed: false,
          category: task.category,
          estimatedMinutes: task.estimatedMinutes || 30,
          subTasks: [],
          aiGenerated: false,
          priority: task.priority || 'medium',
          dueDate: task.dueDate,
          order: get().tasks.length + 1,
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        return id;
      },

      completeTask: (id, completed) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed } : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },

      addSubTask: (taskId, subTask) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subTasks: [
                    ...task.subTasks,
                    {
                      id: generateUniqueId(),
                      title: subTask.title || '',
                      completed: false,
                      estimatedMinutes: subTask.estimatedMinutes || 15,
                    },
                  ],
                }
              : task
          ),
        }));
      },

      completeSubTask: (taskId, subTaskId, completed) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subTasks: task.subTasks.map((subTask) =>
                    subTask.id === subTaskId
                      ? { ...subTask, completed }
                      : subTask
                  ),
                }
              : task
          ),
        }));
      },

      deleteSubTask: (taskId, subTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subTasks: task.subTasks.filter(
                    (subTask) => subTask.id !== subTaskId
                  ),
                }
              : task
          ),
        }));
      },

      updateSubTask: (taskId, subTaskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subTasks: task.subTasks.map((subTask) =>
                    subTask.id === subTaskId
                      ? { ...subTask, ...updates }
                      : subTask
                  ),
                }
              : task
          ),
        }));
      },

      deleteAllSubTasks: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, subTasks: [] } : task
          ),
        }));
      },

      addAIGeneratedSubTasks: (taskId, subTasks) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subTasks: [
                    ...task.subTasks,
                    ...subTasks.map((st) => ({
                      id: generateUniqueId(),
                      title: st.title,
                      completed: false,
                      estimatedMinutes: st.estimatedMinutes,
                    })),
                  ],
                }
              : task
          ),
        }));
      },

      addDailyStats: (stats) => {
        set((state) => ({
          dailyStats: [...state.dailyStats, stats],
        }));
      },

      updatePomodoroSettings: (settings) => {
        set(() => ({
          pomodoroSettings: settings,
        }));
      },

      assignPriority: (taskId, priority) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, priority } : task
          ),
        }));
      },

      autoAssignPriorities: () => {
        set((state) => {
          const sortedTasks = [...state.tasks].sort((a, b) => {
            // First sort by priority weight
            const priorityDiff = (priorityWeights[b.priority || 'medium'] || 0) - 
                               (priorityWeights[a.priority || 'medium'] || 0);
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by completion status
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            
            // Then by creation date
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          return { tasks: sortedTasks };
        });
      },
    }),
    {
      name: 'task-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);