import { useRouter } from 'expo-router';
import {
  ArrowsClockwise,
  Check,
  GearSix,
  NotePencil,
  X,
} from 'phosphor-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card, SectionTitle } from '../../src/components/Card';
import { MacroRow } from '../../src/components/MacroBar';
import { ProgressRing } from '../../src/components/ProgressRing';
import { Screen } from '../../src/components/Screen';
import { getMeal } from '../../src/data/meals';
import { consumedTotals, slotMacros, todayKey } from '../../src/lib/planner';
import { LoggedEntry, MealSlot } from '../../src/lib/types';
import { useAppStore, useTargets } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius, spacing, type } from '../../src/theme/tokens';

function SlotCard({ date, slot }: { date: string; slot: MealSlot }) {
  const { colors } = useTheme();
  const router = useRouter();
  const setSlotStatus = useAppStore((s) => s.setSlotStatus);
  const meal = getMeal(slot.mealId);
  if (!meal) return null;

  const macros = slotMacros(slot);
  const excludedCount = slot.excludedIngredients?.length ?? 0;
  const eaten = slot.status === 'eaten';
  const skipped = slot.status === 'skipped';

  return (
    <Card
      onPress={() =>
        router.push({ pathname: '/meal/[id]', params: { id: meal.id, date, slotId: slot.id } })
      }
      style={{ opacity: skipped ? 0.55 : 1, padding: spacing.md }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable
          onPress={() => setSlotStatus(date, slot.id, eaten ? 'planned' : 'eaten')}
          hitSlop={8}
          style={{
            width: 30,
            height: 30,
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: eaten ? colors.accent : colors.borderStrong,
            backgroundColor: eaten ? colors.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {eaten && <Check size={16} color={colors.onAccent} weight="bold" />}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
            {slot.label}
          </Text>
          <Text
            style={[
              type.bodyMedium,
              {
                color: colors.text,
                textDecorationLine: skipped ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {meal.name}
          </Text>
          <Text style={[type.statSmall, { color: colors.textSecondary }]}>
            {macros.calories} kcal · {macros.protein}g protein
            {slot.scale !== 1 ? ` · ${slot.scale}x` : ''}
            {excludedCount > 0 ? ` · ${excludedCount} left out` : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => setSlotStatus(date, slot.id, skipped ? 'planned' : 'skipped')}
          hitSlop={8}
          style={{ padding: spacing.xs }}
        >
          <X size={18} color={skipped ? colors.danger : colors.textFaint} />
        </Pressable>
      </View>
    </Card>
  );
}

export default function Today() {
  const { colors } = useTheme();
  const router = useRouter();
  const date = todayKey();

  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plans[date]);
  const logs = useAppStore((s) => s.logs[date]);
  const removeLog = useAppStore((s) => s.removeLog);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const targets = useTargets();

  useEffect(() => {
    if (!plan) ensurePlan(date);
  }, [plan, date, ensurePlan]);

  if (!plan) return <Screen title="Today">{null}</Screen>;

  const entries = logs ?? [];
  const consumed = consumedTotals(plan, entries);
  const remaining = Math.max(0, targets.calories - consumed.calories);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen
      title={profile.name ? `Hey, ${profile.name}` : 'Today'}
      subtitle={dateLabel}
      right={
        <Pressable onPress={() => router.push('/settings')} hitSlop={8} style={{ padding: 4 }}>
          <GearSix size={24} color={colors.textSecondary} />
        </Pressable>
      }
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
          <ProgressRing
            size={128}
            strokeWidth={11}
            progress={consumed.calories / targets.calories}
          >
            <Text style={[type.statLarge, { color: colors.text }]}>{consumed.calories}</Text>
            <Text style={[type.label, { color: colors.textFaint }]}>of {targets.calories}</Text>
          </ProgressRing>
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Text style={[type.stat, { color: colors.text }]}>{remaining}</Text>
            <Text style={[type.small, { color: colors.textSecondary, marginTop: -6 }]}>
              kcal remaining
            </Text>
            <Text style={[type.small, { color: colors.textFaint }]}>
              {targets.dailyDelta < 0
                ? `${Math.abs(targets.dailyDelta)} kcal daily deficit`
                : targets.dailyDelta > 0
                  ? `${targets.dailyDelta} kcal daily surplus`
                  : 'maintenance'}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.lg }}>
          <MacroRow totals={consumed} targets={targets} />
        </View>
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button
          label="Log food"
          icon={<NotePencil size={18} color={colors.onAccent} weight="bold" />}
          onPress={() => router.push({ pathname: '/log', params: { date } })}
        />
      </View>

      <SectionTitle
        right={
          <Pressable
            onPress={() => regeneratePlan(date)}
            hitSlop={8}
            style={styles.regen}
          >
            <ArrowsClockwise size={16} color={colors.accent} />
            <Text style={[type.smallMedium, { color: colors.accent }]}>Shuffle</Text>
          </Pressable>
        }
      >
        Meals
      </SectionTitle>
      <View style={{ gap: spacing.sm }}>
        {plan.slots.map((slot) => (
          <SlotCard key={slot.id} date={date} slot={slot} />
        ))}
      </View>

      {entries.length > 0 && (
        <>
          <SectionTitle>Logged today</SectionTitle>
          <View style={{ gap: spacing.sm }}>
            {entries.map((entry) => (
              <LoggedCard key={entry.id} entry={entry} onRemove={() => removeLog(date, entry.id)} />
            ))}
          </View>
        </>
      )}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button
          label="Plan my week"
          variant="secondary"
          onPress={() => router.push('/plan-week')}
        />
        <Button
          label="Grocery list for the week"
          variant="secondary"
          onPress={() => router.push('/groceries')}
        />
      </View>
    </Screen>
  );
}

function LoggedCard({ entry, onRemove }: { entry: LoggedEntry; onRemove: () => void }) {
  const { colors } = useTheme();
  return (
    <Card style={{ padding: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={[type.statSmall, { color: colors.textSecondary }]}>
            {entry.calories} kcal · {entry.protein}g protein
          </Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={8} style={{ padding: spacing.xs }}>
          <X size={18} color={colors.textFaint} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  regen: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
