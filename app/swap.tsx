import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { getMeal } from '../src/data/meals';
import { alternativesFor } from '../src/lib/planner';
import { MealType } from '../src/lib/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing, type } from '../src/theme/tokens';

export default function Swap() {
  const { colors } = useTheme();
  const router = useRouter();
  const { date, slotId, type: mealType } = useLocalSearchParams<{
    date: string;
    slotId: string;
    type: MealType;
  }>();

  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => (date ? s.plans[date] : undefined));
  const swapSlotMeal = useAppStore((s) => s.swapSlotMeal);

  const currentIds = plan?.slots.map((s) => s.mealId) ?? [];
  const slot = plan?.slots.find((s) => s.id === slotId);
  const current = slot ? getMeal(slot.mealId) : undefined;
  const options = alternativesFor(profile, mealType, currentIds);

  return (
    <Screen title="Swap meal" subtitle={current ? `Replacing ${current.name}` : undefined}>
      <View style={{ gap: spacing.sm }}>
        {options.map((meal) => (
          <Card
            key={meal.id}
            onPress={() => {
              if (date && slotId) swapSlotMeal(date, slotId, meal.id);
              // Pop both this picker and the meal detail underneath it.
              router.back();
              router.back();
            }}
            style={{ padding: spacing.md }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text style={[type.bodyMedium, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {meal.name}
              </Text>
              <Text style={[type.statSmall, { color: colors.textSecondary }]}>
                {meal.calories} kcal
              </Text>
            </View>
            <Text style={[type.small, { color: colors.textFaint }]}>
              {meal.protein}g protein · {meal.minutes} min
            </Text>
          </Card>
        ))}
        {options.length === 0 && (
          <Text style={[type.body, { color: colors.textSecondary }]}>
            No other meals fit your current restrictions.
          </Text>
        )}
      </View>
    </Screen>
  );
}
