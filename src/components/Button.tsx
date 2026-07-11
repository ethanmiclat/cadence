import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, type } from '../theme/tokens';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  small,
  style,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? colors.dangerSoft
        : variant === 'secondary'
          ? colors.surface
          : 'transparent';
  const textColor =
    variant === 'primary'
      ? colors.onAccent
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.text
          : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: background,
          borderRadius: radius.pill,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.borderStrong,
          paddingVertical: small ? spacing.sm : 14,
          paddingHorizontal: small ? spacing.lg : spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[small ? type.smallMedium : type.bodyMedium, { color: textColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}
