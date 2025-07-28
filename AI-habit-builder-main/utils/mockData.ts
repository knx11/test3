import { Task, DailyStats, TaskPriority } from '@/types/task';
import { generateUniqueId } from './helpers';
import { format, subDays } from 'date-fns';

export const generateMockTasks = (): Task[] => {
  const now = new Date();
  
  return [
    {
      id: generateUniqueId(),
      title: 'Create project proposal',
      description: 'Draft a comprehensive project proposal for the new client',
      createdAt: subDays(now, 2).toISOString(),
      completed: true,
      category: 'Work',
      estimatedMinutes: 120,
      actualMinutes: 135,
      priority: 'high',
      order: 1,
      subTasks: [
        {
          id: generateUniqueId(),
          title: 'Research client background',
          completed: true,
          estimatedMinutes: 30,
          actualMinutes: 35,
        },
        {
          id: generateUniqueId(),
          title: 'Outline project scope',
          completed: true,
          estimatedMinutes: 45,
          actualMinutes: 50,
        },
        {
          id: generateUniqueId(),
          title: 'Create budget estimate',
          completed: true,
          estimatedMinutes: 45,
          actualMinutes: 50,
        },
      ],
      aiGenerated: true,
    },
    {
      id: generateUniqueId(),
      title: 'Weekly grocery shopping',
      description: 'Buy groceries for the week',
      createdAt: subDays(now, 1).toISOString(),
      completed: true,
      category: 'Personal',
      estimatedMinutes: 60,
      actualMinutes: 75,
      priority: 'medium',
      order: 2,
      subTasks: [
        {
          id: generateUniqueId(),
          title: 'Make shopping list',
          completed: true,
          estimatedMinutes: 15,
          actualMinutes: 10,
        },
        {
          id: generateUniqueId(),
          title: 'Go to supermarket',
          completed: true,
          estimatedMinutes: 30,
          actualMinutes: 45,
        },
        {
          id: generateUniqueId(),
          title: 'Unpack groceries',
          completed: true,
          estimatedMinutes: 15,
          actualMinutes: 20,
        },
      ],
      aiGenerated: false,
    },
    {
      id: generateUniqueId(),
      title: 'Prepare for presentation',
      description: 'Create slides and practice for the team meeting',
      createdAt: now.toISOString(),
      completed: false,
      category: 'Work',
      estimatedMinutes: 90,
      priority: 'high',
      order: 3,
      subTasks: [
        {
          id: generateUniqueId(),
          title: 'Gather data and statistics',
          completed: true,
          estimatedMinutes: 30,
        },
        {
          id: generateUniqueId(),
          title: 'Design presentation slides',
          completed: false,
          estimatedMinutes: 45,
        },
        {
          id: generateUniqueId(),
          title: 'Practice delivery',
          completed: false,
          estimatedMinutes: 15,
        },
      ],
      aiGenerated: true,
    },
    {
      id: generateUniqueId(),
      title: 'Morning workout routine',
      description: 'Complete 30-minute exercise session',
      createdAt: now.toISOString(),
      completed: false,
      category: 'Health',
      estimatedMinutes: 30,
      priority: 'low',
      order: 4,
      subTasks: [
        {
          id: generateUniqueId(),
          title: 'Warm-up stretches',
          completed: false,
          estimatedMinutes: 5,
        },
        {
          id: generateUniqueId(),
          title: 'Cardio session',
          completed: false,
          estimatedMinutes: 15,
        },
        {
          id: generateUniqueId(),
          title: 'Cool down',
          completed: false,
          estimatedMinutes: 10,
        },
      ],
      aiGenerated: false,
    },
    {
      id: generateUniqueId(),
      title: 'Read a book chapter',
      description: 'Continue reading the current book',
      createdAt: now.toISOString(),
      completed: false,
      category: 'Personal',
      estimatedMinutes: 45,
      priority: 'optional',
      order: 5,
      subTasks: [],
      aiGenerated: false,
    },
  ];
};

export const generateMockStats = (): DailyStats[] => {
  const now = new Date();
  const stats: DailyStats[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(now, i), 'yyyy-MM-dd');
    
    stats.push({
      date,
      totalTasksCompleted: Math.floor(Math.random() * 5) + 1,
      totalTimeSpent: (Math.floor(Math.random() * 5) + 1) * 60,
      productivityScore: Math.floor(Math.random() * 40) + 60,
      timeByCategory: {
        Work: Math.floor(Math.random() * 120) + 60,
        Personal: Math.floor(Math.random() * 60) + 30,
        Health: Math.floor(Math.random() * 30) + 15,
      },
    });
  }
  
  return stats;
};