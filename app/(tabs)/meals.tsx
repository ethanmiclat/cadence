import { useRouter } from 'expo-router';
import { ArrowSquareOut, Clock, Plus } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { Screen } from '../../src/components/Screen';
import { MEALS } from '../../src/data/meals';
import { mealCost, formatMoney } from '../../src/lib/cost';
import { eligibleMeals, mealToEntry, todayKey } from '../../src/lib/planner';
import { recipeLink } from '../../src/lib/recipe';
import { Meal, MealType } from '../../src/lib/types';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, type } from '../../src/theme/tokens';

const TYPE_FILTERS: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

const CLEAN_LABEL: Record<Meal['cleanScore'], string> = {
  1: 'Whole food',
  2: 'Balanced',
  3: 'Indulgent',
};

export default function Meals() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const addLog = useAppStore((s) => s.addLog);
  const [filter, setFilter] = useState<MealType | 'all'>('all');
  const [fitsOnly, setFitsOnly] = useState(true);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const meals = useMemo(() => {
    const base = fitsOnly ? eligibleMeals(profile) : MEALS;
    return base.filter((m) => filter === 'all' || m.type === filter);
  }, [profile, filter, fitsOnly]);

  const logMeal = (meal: Meal) => {
    addLog(todayKey(), mealToEntry(meal));
    setJustAdded(meal.id);
    setTimeout(() => setJustAdded((cur) => (cur === meal.id ? null : cur)), 1200);
  };

  return (
    <Screen title="Meal library" subtitle={`${meals.length} recipes`}>
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}
      >
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
        <Chip label="Fits my plan" selected={fitsOnly} onPress={() => setFitsOnly(!fitsOnly)} />
      </View>

      <View style={{ gap: spacing.sm }}>
        {meals.map((meal) => (
          <Card key={meal.id} style={{ padding: spacing.md }}>
            <Pressable
              onPress={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })}
            >
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}
              >
                <Text style={[type.bodyMedium, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {meal.name}
                </Text>
                <Text style={[type.statSmall, { color: colors.textSecondary }]}>
                  {meal.calories} kcal
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginTop: spacing.xs,
                }}
              >
                <Text style={[type.small, { color: colors.textFaint }]}>
                  {meal.protein}g protein · {CLEAN_LABEL[meal.cleanScore]}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Clock size={13} color={colors.textFaint} />
                  <Text style={[type.small, { color: colors.textFaint }]}>{meal.minutes} min</Text>
                </View>
                <Text style={[type.statSmall, { color: colors.textFaint }]}>
                  {formatMoney(mealCost(meal))}
                </Text>
              </View>
            </Pressable>
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.sm,
                marginTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: spacing.sm,
              }}
            >
              <Pressable
                onPress={() => logMeal(meal)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  paddingVertical: 6,
                }}
              >
                <Plus size={15} color={colors.accent} weight="bold" />
                <Text style={[type.smallMedium, { color: colors.accent }]}>
                  {justAdded === meal.id ? 'Logged!' : 'Log it'}
                </Text>
              </Pressable>
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <Pressable
                onPress={() => Linking.openURL(recipeLink(meal))}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  paddingVertical: 6,
                }}
              >
                <ArrowSquareOut size={15} color={colors.textSecondary} />
                <Text style={[type.smallMedium, { color: colors.textSecondary }]}>Recipe</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
