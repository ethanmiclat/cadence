import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, type } from '../theme/tokens';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, target, color, unit = 'g' }: MacroBarProps) {
  const { colors } = useTheme();
  const pct = target > 0 ? Math.min(1, current / target) : 0;

  return (
    <View style={{ gap: 6, flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[type.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[type.statSmall, { color: colors.textSecondary }]}>
          {Math.round(current)}/{Math.round(target)}
          {unit}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.track,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            borderRadius: radius.pill,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

export function MacroRow({
  totals,
  targets,
}: {
  totals: { protein: number; carbs: number; fat: number };
  targets: { protein: number; carbs: number; fat: number };
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.lg }}>
      <MacroBar label="PROTEIN" current={totals.protein} target={targets.protein} color={colors.protein} />
      <MacroBar label="CARBS" current={totals.carbs} target={targets.carbs} color={colors.carbs} />
      <MacroBar label="FAT" current={totals.fat} target={targets.fat} color={colors.fat} />
    </View>
  );
}
