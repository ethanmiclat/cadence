import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, radius, spacing, type } from '../theme/tokens';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** pretty display when not being edited, e.g. "6'1\"" or "$70.00" */
  format?: (value: number) => string;
  /** base value -> the number shown while typing (e.g. kg -> lb) */
  toDisplay?: (value: number) => number;
  /** the typed number -> base value (inverse of toDisplay) */
  fromDisplay?: (display: number) => number;
}

function trim(n: number): string {
  return `${Math.round(n * 100) / 100}`;
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  toDisplay,
  fromDisplay,
}: StepperProps) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const toDisp = toDisplay ?? ((v) => v);
  const fromDisp = fromDisplay ?? ((v) => v);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const bump = (dir: 1 | -1) => {
    const next = Math.round((value + dir * step) * 100) / 100;
    onChange(clamp(next));
  };

  const commit = () => {
    const n = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(n)) onChange(clamp(fromDisp(n)));
    setEditing(false);
  };

  const StepButton = ({ dir, label }: { dir: 1 | -1; label: string }) => (
    <Pressable
      onPress={() => bump(dir)}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        backgroundColor: colors.track,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 20, color: colors.text }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <StepButton dir={-1} label="−" />
      <TextInput
        value={editing ? text : format ? format(value) : trim(value)}
        onFocus={() => {
          setText(trim(toDisp(value)));
          setEditing(true);
        }}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={[
          type.stat,
          { color: colors.text, minWidth: 96, textAlign: 'center', paddingVertical: 4 },
        ]}
      />
      <StepButton dir={1} label="+" />
    </View>
  );
}
