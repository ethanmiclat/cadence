import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowsClockwise, ArrowSquareOut, Check } from 'phosphor-react-native';
import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card, SectionTitle } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { Stepper } from '../../src/components/Stepper';
import { getMeal } from '../../src/data/meals';
import { formatMoney, mealCost } from '../../src/lib/cost';
import { customizedMeal } from '../../src/lib/customize';
import { recipeLink } from '../../src/lib/recipe';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius, spacing, type } from '../../src/theme/tokens';

export default function MealDetail() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; date?: string; slotId?: string }>();

  const meal = getMeal(params.id);
  const date = params.date;
  const slotId = params.slotId;

  const plan = useAppStore((s) => (date ? s.plans[date] : undefined));
  const setSlotStatus = useAppStore((s) => s.setSlotStatus);
  const setSlotScale = useAppStore((s) => s.setSlotScale);
  const toggleSlotIngredient = useAppStore((s) => s.toggleSlotIngredient);
  const slot = plan?.slots.find((s) => s.id === slotId);

  if (!meal) {
    return (
      <Screen title="Not found">
        <Button label="Go back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const scale = slot?.scale ?? 1;
  const excluded = slot?.excludedIngredients ?? [];
  const custom = customizedMeal(meal, excluded);
  const canCustomize = !!(slot && date);
  const macros = {
    calories: Math.round(custom.calories * scale),
    protein: Math.round(custom.protein * scale),
    carbs: Math.round(custom.carbs * scale),
    fat: Math.round(custom.fat * scale),
  };
  const perServingCost = canCustomize ? custom.cost : mealCost(meal);
  const eaten = slot?.status === 'eaten';

  const MacroCell = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={[type.stat, { color }]}>{value}</Text>
      <Text style={[type.label, { color: colors.textFaint }]}>{label}</Text>
    </View>
  );

  return (
    <Screen
      title={meal.name}
      subtitle={`${meal.type} · ${meal.minutes} min`}
      right={
        slot && date ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/swap', params: { date, slotId: slot.id, type: meal.type } })
            }
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}
          >
            <ArrowsClockwise size={18} color={colors.accent} />
            <Text style={[type.smallMedium, { color: colors.accent }]}>Swap</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
            <ArrowLeft size={22} color={colors.textSecondary} />
          </Pressable>
        )
      }
    >
      <Card>
        <View style={{ flexDirection: 'row' }}>
          <MacroCell label="KCAL" value={`${macros.calories}`} color={colors.text} />
          <MacroCell label="PROTEIN" value={`${macros.protein}g`} color={colors.protein} />
          <MacroCell label="CARBS" value={`${macros.carbs}g`} color={colors.carbs} />
          <MacroCell label="FAT" value={`${macros.fat}g`} color={colors.fat} />
        </View>
        <Text
          style={[
            type.small,
            { color: colors.textFaint, textAlign: 'center', marginTop: spacing.md },
          ]}
        >
          Approx. {formatMoney(perServingCost * scale)} in groceries per serving
        </Text>
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button
          label="View full recipe"
          variant="secondary"
          icon={<ArrowSquareOut size={18} color={colors.text} />}
          onPress={() => Linking.openURL(recipeLink(meal))}
        />
      </View>

      {slot && date && (
        <>
          <SectionTitle>Portion</SectionTitle>
          <Card style={{ alignItems: 'center' }}>
            <Stepper
              value={scale}
              min={0.5}
              max={2.5}
              step={0.25}
              format={(v) => `${v}x`}
              onChange={(v) => setSlotScale(date, slot.id, v)}
            />
          </Card>
        </>
      )}

      <SectionTitle>Ingredients</SectionTitle>
      {canCustomize && (
        <Text style={[type.small, { color: colors.textFaint, marginBottom: spacing.sm }]}>
          Tap an ingredient to leave it out. Macros, cost, and your grocery list update to match.
        </Text>
      )}
      <Card style={{ gap: spacing.xs }}>
        {meal.ingredients.map((ing) => {
          const isOut = excluded.includes(ing.item);
          const Row = (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: 6,
              }}
            >
              {canCustomize && (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: radius.sm,
                    borderWidth: 1.5,
                    borderColor: isOut ? colors.border : colors.accent,
                    backgroundColor: isOut ? 'transparent' : colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!isOut && <Check size={13} color={colors.onAccent} weight="bold" />}
                </View>
              )}
              <Text
                style={[
                  type.body,
                  {
                    color: isOut ? colors.textFaint : colors.text,
                    flex: 1,
                    textDecorationLine: isOut ? 'line-through' : 'none',
                  },
                ]}
              >
                {ing.item}
              </Text>
              <Text
                style={[
                  type.statSmall,
                  { color: isOut ? colors.textFaint : colors.textSecondary },
                ]}
              >
                {Math.round(ing.qty * scale * 100) / 100}
                {ing.unit ? ` ${ing.unit}` : ''}
              </Text>
            </View>
          );
          return canCustomize ? (
            <Pressable key={ing.item} onPress={() => toggleSlotIngredient(date!, slot!.id, ing.item)}>
              {Row}
            </Pressable>
          ) : (
            <View key={ing.item}>{Row}</View>
          );
        })}
      </Card>

      <SectionTitle>Steps</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {meal.steps.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
            <Text style={[type.statSmall, { color: colors.accent }]}>{i + 1}</Text>
            <Text style={[type.body, { color: colors.text, flex: 1 }]}>{step}</Text>
          </View>
        ))}
      </Card>

      {slot && date && (
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button
            label={eaten ? 'Marked as eaten' : 'Mark as eaten'}
            variant={eaten ? 'secondary' : 'primary'}
            onPress={() => {
              setSlotStatus(date, slot.id, eaten ? 'planned' : 'eaten');
              router.back();
            }}
          />
        </View>
      )}
    </Screen>
  );
}
