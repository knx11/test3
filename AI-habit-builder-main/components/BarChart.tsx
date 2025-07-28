import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';

interface BarChartProps {
  data: number[];
  labels: string[];
  height?: number;
  barColor?: string;
  maxValue?: number;
}

export default function BarChart({
  data,
  labels,
  height = 200,
  barColor = colors.primary,
  maxValue,
}: BarChartProps) {
  const chartMaxValue = maxValue || Math.max(...data, 1) * 1.2;
  
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chart}>
        {data.map((value, index) => {
          const barHeight = (value / chartMaxValue) * height * 0.8;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barLabelContainer}>
                <Text style={styles.barValue}>{value}</Text>
              </View>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                  },
                ]}
              />
              <Text style={styles.label}>{labels[index]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  bar: {
    width: '60%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: colors.text,
  },
});