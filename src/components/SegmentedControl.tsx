import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, type } from '../theme/tokens';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.track,
        borderRadius: radius.md,
        padding: 3,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: radius.sm,
              alignItems: 'center',
              backgroundColor: selected ? colors.surfaceRaised : 'transparent',
              borderWidth: selected ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <Text
              style={[
                type.smallMedium,
                { color: selected ? colors.text : colors.textFaint },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
