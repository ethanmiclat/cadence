import { useLocalSearchParams, useRouter } from 'expo-router';
import { MagnifyingGlass, Plus } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { MEALS } from '../src/data/meals';
import { mealToEntry } from '../src/lib/planner';
import { LoggedEntry } from '../src/lib/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeContext';
import { radius, spacing, type } from '../src/theme/tokens';

function num(s: string): number {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export default function LogScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const addLog = useAppStore((s) => s.addLog);

  const [mode, setMode] = useState<'custom' | 'library'>('custom');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? MEALS.filter((m) => m.name.toLowerCase().includes(q)) : MEALS;
    return base.slice(0, 40);
  }, [query]);

  const saveCustom = () => {
    const entry: LoggedEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || 'Food',
      calories: num(calories),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
      source: 'custom',
      time: new Date().toISOString(),
    };
    addLog(date, entry);
    router.back();
  };

  const field = (
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    flex = 1
  ) => (
    <View style={{ flex, gap: 6 }}>
      <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
        {placeholder}
      </Text>
      <TextInput
        value={value}
        onChangeText={setter}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.textFaint}
        style={[
          type.stat,
          {
            color: colors.text,
            backgroundColor: colors.track,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            textAlign: 'center',
          },
        ]}
      />
    </View>
  );

  return (
    <Screen title="Log food" subtitle="Anything you ate">
      <SegmentedControl
        options={[
          { value: 'custom', label: 'Custom entry' },
          { value: 'library', label: 'From library' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'custom' ? (
        <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
          <View style={{ gap: 6 }}>
            <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
              What did you eat?
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Chicken burrito"
              placeholderTextColor={colors.textFaint}
              style={[
                type.body,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                },
              ]}
            />
          </View>
          {field(calories, setCalories, 'Calories')}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {field(protein, setProtein, 'Protein g')}
            {field(carbs, setCarbs, 'Carbs g')}
            {field(fat, setFat, 'Fat g')}
          </View>
          <Button label="Add to today" onPress={saveCustom} disabled={num(calories) === 0} />
        </View>
      ) : (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
            }}
          >
            <MagnifyingGlass size={18} color={colors.textFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search meals"
              placeholderTextColor={colors.textFaint}
              style={[type.body, { color: colors.text, flex: 1, paddingVertical: spacing.md }]}
            />
          </View>
          {results.map((meal) => (
            <Card key={meal.id} style={{ padding: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={1}>
                    {meal.name}
                  </Text>
                  <Text style={[type.statSmall, { color: colors.textSecondary }]}>
                    {meal.calories} kcal · {meal.protein}g protein
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    addLog(date, mealToEntry(meal));
                    router.back();
                  }}
                  hitSlop={8}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radius.pill,
                    backgroundColor: colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={18} color={colors.accent} weight="bold" />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
