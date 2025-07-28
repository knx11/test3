export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
  actualMinutes?: number;
}

export type TaskPriority = 'high' | 'medium' | 'low' | 'optional';

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  dueDate?: string;
  completed: boolean;
  category?: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  subTasks: SubTask[];
  aiGenerated: boolean;
  priority?: TaskPriority;
  order?: number;
}

export interface TimeBlock {
  taskId: string;
  subTaskId?: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

export interface DailyStats {
  date: string;
  totalTasksCompleted: number;
  totalTimeSpent: number; // in minutes
  productivityScore: number; // 0-100
  timeByCategory: Record<string, number>; // category -> minutes
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsBeforeLongBreak: number;
}