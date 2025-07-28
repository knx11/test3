import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Settings, TrendingUp, CheckCircle2, Clock, Plus, Pencil } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useTaskStore } from '@/store/taskStore';
import TaskItem from '@/components/TaskItem';
import AnalyticsCard from '@/components/AnalyticsCard';
import BrainDumpModal from '@/components/BrainDumpModal';

export default function HomeScreen() {
  const router = useRouter();
  const { tasks, dailyStats } = useTaskStore();
  const [showBrainDump, setShowBrainDump] = useState(false);

  // Get today's stats
  const todayStats = dailyStats.length > 0 ? dailyStats[dailyStats.length - 1] : null;

  // Get high priority tasks
  const highPriorityTasks = tasks
    .filter(task => task.priority === 'high' && !task.completed)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Home',
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

      <ScrollView style={styles.content}>
        <TouchableOpacity 
          style={styles.overviewCard}
          onPress={() => router.push('/analytics')}
        >
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Today's Overview</Text>
            <Text style={styles.seeMoreText}>See More</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <CheckCircle2 size={20} color={colors.primary} />
              <Text style={styles.statValue}>
                {todayStats?.totalTasksCompleted || 0}
              </Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Clock size={20} color={colors.secondary} />
              <Text style={styles.statValue}>
                {todayStats ? `${Math.floor(todayStats.totalTimeSpent / 60)}h ${todayStats.totalTimeSpent % 60}m` : "0h"}
              </Text>
              <Text style={styles.statLabel}>Time Spent</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <TrendingUp size={20} color={colors.accent} />
              <Text style={styles.statValue}>
                {todayStats?.productivityScore || 0}%
              </Text>
              <Text style={styles.statLabel}>Productivity</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>High Priority Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {highPriorityTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onPress={() => router.push('/(tabs)')}
              onLongPress={() => {}}
            />
          ))}
          {highPriorityTasks.length === 0 && (
            <Text style={styles.emptyText}>No high priority tasks</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                <Plus size={24} color={colors.background} />
              </View>
              <Text style={styles.quickActionText}>New Task</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setShowBrainDump(true)}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
                <Pencil size={24} color={colors.background} />
              </View>
              <Text style={styles.quickActionText}>Brain Dump</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BrainDumpModal
        visible={showBrainDump}
        onClose={() => setShowBrainDump(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeMoreText: {
    color: colors.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});