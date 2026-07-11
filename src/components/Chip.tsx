import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, type } from '../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        borderRadius: radius.pill,
        paddingVertical: 7,
        paddingHorizontal: spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={[type.smallMedium, { color: selected ? colors.accent : colors.textSecondary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
