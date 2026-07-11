import { useRouter } from 'expo-router';
import { CaretRight, CheckCircle, Pencil, Plus } from 'phosphor-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card, SectionTitle } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { getSplit } from '../../src/data/splits';
import { addDays, todayKey } from '../../src/lib/planner';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, type } from '../../src/theme/tokens';

export default function Train() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const workouts = useAppStore((s) => s.workouts);
  const customSplits = useAppStore((s) => s.customSplits);
  const split = getSplit(profile.splitId, customSplits);
  const isCustom = customSplits.some((s) => s.id === split.id);

  const today = todayKey();
  const weekStart = addDays(today, -6);
  const thisWeek = workouts.filter((w) => w.completed && w.date >= weekStart && w.date <= today);
  const doneToday = new Set(
    workouts.filter((w) => w.completed && w.date === today).map((w) => w.splitDayId)
  );

  const recent = [...workouts]
    .filter((w) => w.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <Screen title="Training" subtitle={split.name}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
          <Text style={[type.statLarge, { color: colors.text }]}>{thisWeek.length}</Text>
          <Text style={[type.small, { color: colors.textSecondary }]}>
            of {profile.trainingDaysPerWeek} sessions in the last 7 days
          </Text>
        </View>
      </Card>

      <SectionTitle
        right={
          isCustom ? (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/edit-split', params: { id: split.id } })
              }
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Pencil size={15} color={colors.accent} />
              <Text style={[type.smallMedium, { color: colors.accent }]}>Edit</Text>
            </Pressable>
          ) : undefined
        }
      >
        Sessions
      </SectionTitle>
      <View style={{ gap: spacing.sm }}>
        {split.days.map((day) => {
          const done = doneToday.has(day.id);
          return (
            <Card
              key={day.id}
              onPress={() =>
                router.push({ pathname: '/workout/[dayId]', params: { dayId: day.id } })
              }
              style={{ padding: spacing.md }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyMedium, { color: colors.text }]}>{day.name}</Text>
                  <Text style={[type.small, { color: colors.textFaint }]}>
                    {day.focus} · {day.exercises.length} exercises
                  </Text>
                </View>
                {done ? (
                  <CheckCircle size={22} color={colors.accent} weight="fill" />
                ) : (
                  <CaretRight size={18} color={colors.textFaint} />
                )}
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button
          label="Create your own workout"
          variant="secondary"
          icon={<Plus size={18} color={colors.text} weight="bold" />}
          onPress={() => router.push('/edit-split')}
        />
      </View>

      {recent.length > 0 && (
        <>
          <SectionTitle>Recent</SectionTitle>
          <View style={{ gap: spacing.sm }}>
            {recent.map((w) => {
              const day = split.days.find((d) => d.id === w.splitDayId);
              const sets = w.exercises.reduce((n, e) => n + e.sets.length, 0);
              return (
                <Card key={`${w.date}-${w.splitDayId}`} style={{ padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[type.bodyMedium, { color: colors.text }]}>
                      {day?.name ?? w.splitDayId}
                    </Text>
                    <Text style={[type.statSmall, { color: colors.textFaint }]}>{w.date}</Text>
                  </View>
                  <Text style={[type.small, { color: colors.textSecondary }]}>
                    {sets} sets logged
                  </Text>
                </Card>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}
