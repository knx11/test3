import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface PieChartData {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

export default function PieChart({ data, size = 180 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate the percentage and angle for each segment
  let startAngle = 0;
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    const segment = {
      ...item,
      percentage,
      startAngle,
      endAngle: startAngle + angle,
    };
    startAngle += angle;
    return segment;
  });
  
  return (
    <View style={styles.container}>
      <View style={[styles.chart, { width: size, height: size }]}>
        {segments.map((segment, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: segment.color,
                transform: [
                  { rotate: `${segment.startAngle}deg` },
                  { translateX: size / 2 },
                  { translateY: size / 2 },
                  { rotate: `-${segment.startAngle}deg` },
                  { translateX: -size / 2 },
                  { translateY: -size / 2 },
                ],
                width: segment.percentage > 0 ? '100%' : 0,
                height: segment.percentage > 0 ? '100%' : 0,
              },
            ]}
          />
        ))}
      </View>
      
      <View style={styles.legend}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: segment.color }]}
            />
            <Text style={styles.legendLabel}>{segment.label}</Text>
            <Text style={styles.legendValue}>
              {segment.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chart: {
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  legend: {
    marginTop: 24,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    color: colors.text,
  },
  legendValue: {
    color: colors.textLight,
    fontWeight: '500',
  },
});