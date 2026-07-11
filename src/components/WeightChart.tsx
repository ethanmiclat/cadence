import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { kgToLb } from '../lib/nutrition';
import { Units, WeighIn } from '../lib/types';
import { useTheme } from '../theme/ThemeContext';
import { type } from '../theme/tokens';

interface WeightChartProps {
  weighIns: WeighIn[];
  goalKg: number;
  units: Units;
  height?: number;
}

export function WeightChart({ weighIns, goalKg, units, height = 160 }: WeightChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  if (weighIns.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[type.small, { color: colors.textFaint }]}>
          Log at least two weigh-ins to see your trend.
        </Text>
      </View>
    );
  }

  const display = (kg: number) => (units === 'imperial' ? kgToLb(kg) : kg);
  const values = weighIns.map((w) => w.weightKg);
  const min = Math.min(...values, goalKg);
  const max = Math.max(...values, goalKg);
  const pad = Math.max((max - min) * 0.15, 0.5);
  const lo = min - pad;
  const hi = max + pad;

  const inset = 10;
  const x = (i: number) =>
    inset + (i / (weighIns.length - 1)) * (width - inset * 2);
  const y = (kg: number) => inset + (1 - (kg - lo) / (hi - lo)) * (height - inset * 2);

  const path = weighIns
    .map((w, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(w.weightKg).toFixed(1)}`)
    .join(' ');
  const last = weighIns[weighIns.length - 1];

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line
            x1={inset}
            y1={y(goalKg)}
            x2={width - inset}
            y2={y(goalKg)}
            stroke={colors.borderStrong}
            strokeWidth={1}
            strokeDasharray="4 5"
          />
          <Path d={path} stroke={colors.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          <Circle
            cx={x(weighIns.length - 1)}
            cy={y(last.weightKg)}
            r={5}
            fill={colors.accent}
            stroke={colors.surface}
            strokeWidth={2}
          />
        </Svg>
      )}
      <Text
        style={[
          type.statSmall,
          { color: colors.textFaint, position: 'absolute', right: inset, top: y(goalKg) - 18 },
        ]}
      >
        goal {display(goalKg).toFixed(0)}
      </Text>
    </View>
  );
}
