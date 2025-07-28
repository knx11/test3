import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { Task, SubTask, DailyStats } from '@/types/task';

export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return `${hours}h ${mins}m`;
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
};

export const getWeekDates = () => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start, end }).map((date: Date) => format(date, 'yyyy-MM-dd'));
};

export const calculateProductivityScore = (
  completedTasks: number,
  totalTasks: number,
  timeSpentMinutes: number,
  estimatedTimeMinutes: number
): number => {
  if (totalTasks === 0 || estimatedTimeMinutes === 0) return 0;
  
  const completionRatio = completedTasks / totalTasks;
  const timeEfficiencyRatio = Math.min(estimatedTimeMinutes / Math.max(timeSpentMinutes, 1), 2);
  
  // Weight completion more heavily than time efficiency
  const score = (completionRatio * 0.7 + (timeEfficiencyRatio / 2) * 0.3) * 100;
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
};

export const calculateTaskProgress = (task: Task): number => {
  if (task.subTasks.length === 0) return task.completed ? 100 : 0;
  
  const completedSubTasks = task.subTasks.filter((subTask) => subTask.completed).length;
  return Math.round((completedSubTasks / task.subTasks.length) * 100);
};

export const estimateTaskTime = (title: string, description: string): number => {
  // Simple estimation logic - can be improved with AI
  const wordCount = (title + ' ' + description).split(/\s+/).length;
  
  // Base time: 30 minutes
  let baseTime = 30;
  
  // Adjust based on complexity indicators in the text
  if (title.toLowerCase().includes('research') || description.toLowerCase().includes('research')) {
    baseTime += 60;
  }
  
  if (title.toLowerCase().includes('meeting') || description.toLowerCase().includes('meeting')) {
    baseTime += 30;
  }
  
  // Adjust based on word count
  baseTime += Math.floor(wordCount / 10) * 5;
  
  return baseTime;
};

export const getTimeSpentByCategory = (
  tasks: Task[],
  startDate: string,
  endDate: string
): Record<string, number> => {
  const result: Record<string, number> = {};
  
  tasks.forEach((task) => {
    if (task.createdAt >= startDate && task.createdAt <= endDate && task.category) {
      const timeSpent = task.actualMinutes || 0;
      result[task.category] = (result[task.category] || 0) + timeSpent;
    }
  });
  
  return result;
};

export const generateWeeklyStats = (
  tasks: Task[],
  dailyStats: DailyStats[]
): { labels: string[]; data: number[] } => {
  const weekDates = getWeekDates();
  const labels = weekDates.map((date: string) => format(new Date(date), 'EEE'));
  const data = weekDates.map((date: string) => {
    const stats = dailyStats.find((stat) => stat.date === date);
    return stats ? stats.productivityScore : 0;
  });
  
  return { labels, data };
};