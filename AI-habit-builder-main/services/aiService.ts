import { Task, SubTask, TaskPriority } from '@/types/task';

interface AITaskBreakdownResponse {
  subTasks: Array<{
    title: string;
    estimatedMinutes: number;
  }>;
  totalEstimatedMinutes: number;
  suggestedPriority?: TaskPriority;
}

export const generateTaskBreakdown = async (
  taskTitle: string,
  taskDescription: string
): Promise<AITaskBreakdownResponse> => {
  try {
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Use the toolkit.rork.com endpoint instead of Gemini API directly
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful task breakdown assistant. Break down tasks into smaller subtasks with time estimates and suggest a priority level.'
            },
            {
              role: 'user',
              content: `Break down this task into smaller subtasks:
Task: ${taskTitle}
Description: ${taskDescription || "No description provided"}

Please provide a JSON response with:
1. A list of subtasks with titles and estimated time in minutes
2. A total estimated time for the entire task
3. A suggested priority level (high, medium, low, or optional)

Format your response as a valid JSON object with this structure:
{
  "subTasks": [
    { "title": "Subtask 1", "estimatedMinutes": 30 },
    { "title": "Subtask 2", "estimatedMinutes": 45 }
  ],
  "totalEstimatedMinutes": 75,
  "suggestedPriority": "high"
}`
            }
          ]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('API response error:', response.status);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.completion) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from AI service');
      }
      
      // Extract JSON from the completion text
      const textResponse = data.completion;
      let jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // If no JSON object is found, try to create a default breakdown
        return createDefaultBreakdown(taskTitle, taskDescription);
      }

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return createDefaultBreakdown(taskTitle, taskDescription);
      }
      
      // Validate the response structure
      if (!jsonResponse.subTasks || !Array.isArray(jsonResponse.subTasks) || 
          typeof jsonResponse.totalEstimatedMinutes !== 'number') {
        console.error('AI response missing required fields:', jsonResponse);
        return createDefaultBreakdown(taskTitle, taskDescription);
      }
      
      return {
        subTasks: jsonResponse.subTasks,
        totalEstimatedMinutes: jsonResponse.totalEstimatedMinutes,
        suggestedPriority: jsonResponse.suggestedPriority || determinePriority(taskTitle, taskDescription),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Network error:', error);
      return createDefaultBreakdown(taskTitle, taskDescription);
    }
  } catch (error) {
    console.error('Error generating task breakdown:', error);
    // Always return a valid response even if the network request fails
    return createDefaultBreakdown(taskTitle, taskDescription);
  }
};

// Determine priority based on task content
const determinePriority = (title: string, description: string): TaskPriority => {
  const combinedText = (title + ' ' + (description || '')).toLowerCase();
  
  // Check for high priority indicators
  if (
    combinedText.includes('urgent') ||
    combinedText.includes('asap') ||
    combinedText.includes('deadline') ||
    combinedText.includes('important') ||
    combinedText.includes('critical')
  ) {
    return 'high';
  }
  
  // Check for medium priority indicators
  if (
    combinedText.includes('soon') ||
    combinedText.includes('this week') ||
    combinedText.includes('meeting') ||
    combinedText.includes('report')
  ) {
    return 'medium';
  }
  
  // Check for low priority indicators
  if (
    combinedText.includes('when possible') ||
    combinedText.includes('eventually') ||
    combinedText.includes('routine') ||
    combinedText.includes('regular')
  ) {
    return 'low';
  }
  
  // Check for optional indicators
  if (
    combinedText.includes('optional') ||
    combinedText.includes('if time') ||
    combinedText.includes('nice to have') ||
    combinedText.includes('consider')
  ) {
    return 'optional';
  }
  
  // Default to medium priority
  return 'medium';
};

// Improved fallback function to create a default breakdown when AI fails
const createDefaultBreakdown = (title: string, description: string): AITaskBreakdownResponse => {
  const words = (title + ' ' + (description || '')).split(/\s+/).length;
  const complexity = Math.min(Math.max(words / 10, 1), 5);
  
  // Create 2-4 subtasks based on the title
  const subtaskCount = Math.max(2, Math.min(Math.floor(complexity) + 1, 4));
  const totalTime = Math.max(30, Math.floor(complexity * 20));
  const timePerTask = Math.floor(totalTime / subtaskCount);
  
  const subtasks = [];
  
  // Generate generic subtasks
  subtasks.push({ title: "Plan and organize", estimatedMinutes: timePerTask });
  
  if (subtaskCount >= 3) {
    subtasks.push({ title: "Research and gather information", estimatedMinutes: timePerTask });
  }
  
  subtasks.push({ title: "Execute main task", estimatedMinutes: timePerTask });
  
  if (subtaskCount >= 4) {
    subtasks.push({ title: "Review and finalize", estimatedMinutes: timePerTask });
  }
  
  return {
    subTasks: subtasks,
    totalEstimatedMinutes: totalTime,
    suggestedPriority: determinePriority(title, description)
  };
};

export const getProductivityInsights = async (
  completedTasks: number,
  totalTasks: number,
  productivityScore: number,
  timeByCategory: Record<string, number>
): Promise<string> => {
  try {
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const categoryBreakdown = Object.entries(timeByCategory)
      .map(([category, minutes]) => `${category}: ${minutes} minutes`)
      .join(", ");
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
    const prompt = `I'm looking for productivity insights based on my recent activity. Here's my data:
- Completed ${completedTasks} out of ${totalTasks} tasks (${completionRate.toFixed(1)}% completion rate)
- Productivity score: ${productivityScore}%
- Time spent by category: ${categoryBreakdown || "No category data available"}

Please provide a concise analysis (2-3 sentences) of my productivity and one actionable suggestion to improve it.`;

    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a productivity coach providing brief, actionable insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get AI insights: ' + response.status);
      }

      const data = await response.json();
      if (!data.completion) {
        return getDefaultInsights(completedTasks, totalTasks, productivityScore);
      }
      
      return data.completion;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Network error getting insights:', error);
      return getDefaultInsights(completedTasks, totalTasks, productivityScore);
    }
  } catch (error) {
    console.error('Error getting productivity insights:', error);
    return getDefaultInsights(completedTasks, totalTasks, productivityScore);
  }
};

const getDefaultInsights = (completedTasks: number, totalTasks: number, productivityScore: number): string => {
  if (totalTasks === 0) {
    return "Add tasks to get personalized productivity insights.";
  }
  
  const completionRate = (completedTasks / totalTasks) * 100;
  
  if (completionRate >= 80) {
    return "Great job completing most of your tasks! Consider challenging yourself with more complex tasks to further develop your skills.";
  } else if (completionRate >= 50) {
    return "You're making good progress. Try breaking down your remaining tasks into smaller, more manageable subtasks to increase completion rate.";
  } else {
    return "Your task completion rate is lower than ideal. Focus on prioritizing essential tasks and consider using the Pomodoro technique to improve focus.";
  }
};