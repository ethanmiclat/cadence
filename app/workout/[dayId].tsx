import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { Exercise, getSplit } from '../../src/data/splits';
import { kgToLb, lbToKg } from '../../src/lib/nutrition';
import { todayKey } from '../../src/lib/planner';
import { ExerciseLog } from '../../src/lib/types';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius, spacing, type } from '../../src/theme/tokens';

interface SetDraft {
  weight: string;
  reps: string;
}

export default function Workout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();

  const profile = useAppStore((s) => s.profile);
  const workouts = useAppStore((s) => s.workouts);
  const customSplits = useAppStore((s) => s.customSplits);
  const saveWorkout = useAppStore((s) => s.saveWorkout);

  const split = getSplit(profile.splitId, customSplits);
  const day = split.days.find((d) => d.id === dayId) ?? split.days[0];
  const imperial = profile.units === 'imperial';

  // Local, editable copy so extra exercises can be added just for this session.
  const [exercises, setExercises] = useState<Exercise[]>(day.exercises);
  const [newExercise, setNewExercise] = useState('');

  const lastLog = useMemo(
    () =>
      [...workouts]
        .filter((w) => w.splitDayId === day.id && w.completed)
        .sort((a, b) => b.date.localeCompare(a.date))[0],
    [workouts, day.id]
  );

  const [drafts, setDrafts] = useState<Record<string, SetDraft[]>>(() => {
    const initial: Record<string, SetDraft[]> = {};
    for (const ex of day.exercises) {
      const prev = lastLog?.exercises.find((e) => e.exerciseId === ex.id);
      const count = Math.max(ex.sets, prev?.sets.length ?? 0);
      initial[ex.id] = Array.from({ length: count }, (_, i) => {
        const prevSet = prev?.sets[i];
        return {
          weight: prevSet ? `${Math.round(imperial ? kgToLb(prevSet.weightKg) : prevSet.weightKg)}` : '',
          reps: prevSet ? `${prevSet.reps}` : '',
        };
      });
    }
    return initial;
  });

  const updateSet = (exId: string, index: number, patch: Partial<SetDraft>) =>
    setDrafts((d) => ({
      ...d,
      [exId]: d[exId].map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const addSet = (exId: string) =>
    setDrafts((d) => ({ ...d, [exId]: [...(d[exId] ?? []), { weight: '', reps: '' }] }));

  const addExercise = () => {
    const trimmed = newExercise.trim();
    if (!trimmed) return;
    const ex: Exercise = { id: `adhoc-${Date.now()}`, name: trimmed, sets: 3, reps: '—' };
    setExercises((list) => [...list, ex]);
    setDrafts((d) => ({ ...d, [ex.id]: [{ weight: '', reps: '' }] }));
    setNewExercise('');
  };

  const finish = () => {
    const logged: ExerciseLog[] = exercises
      .map((ex) => ({
        exerciseId: ex.id,
        sets: (drafts[ex.id] ?? [])
          .map((s) => ({
            reps: parseInt(s.reps, 10),
            weightKg: (() => {
              const w = parseFloat(s.weight.replace(',', '.'));
              if (!Number.isFinite(w)) return 0;
              return imperial ? lbToKg(w) : w;
            })(),
          }))
          .filter((s) => Number.isFinite(s.reps) && s.reps > 0),
      }))
      .filter((e) => e.sets.length > 0);

    saveWorkout({ date: todayKey(), splitDayId: day.id, exercises: logged, completed: true });
    router.back();
  };

  const loggedSets = Object.values(drafts)
    .flat()
    .filter((s) => parseInt(s.reps, 10) > 0).length;

  const inputStyle = [
    type.statSmall,
    {
      color: colors.text,
      backgroundColor: colors.track,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      minWidth: 56,
      textAlign: 'center' as const,
    },
  ];

  return (
    <Screen title={day.name} subtitle={day.focus}>
      <View style={{ gap: spacing.md }}>
        {exercises.map((ex) => (
          <Card key={ex.id} style={{ padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[type.bodyMedium, { color: colors.text }]}>{ex.name}</Text>
              <Text style={[type.statSmall, { color: colors.textFaint }]}>
                {ex.sets} x {ex.reps}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, paddingLeft: 28 }}>
              <Text style={[type.label, { color: colors.textFaint, minWidth: 56, textAlign: 'center' }]}>
                {imperial ? 'LB' : 'KG'}
              </Text>
              <Text style={[type.label, { color: colors.textFaint, minWidth: 56, textAlign: 'center' }]}>
                REPS
              </Text>
            </View>
            {(drafts[ex.id] ?? []).map((set, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              >
                <Text style={[type.statSmall, { color: colors.textFaint, width: 16 }]}>{i + 1}</Text>
                <TextInput
                  value={set.weight}
                  onChangeText={(weight) => updateSet(ex.id, i, { weight })}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textFaint}
                  style={inputStyle}
                />
                <TextInput
                  value={set.reps}
                  onChangeText={(reps) => updateSet(ex.id, i, { reps })}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textFaint}
                  style={inputStyle}
                />
              </View>
            ))}
            <Pressable
              onPress={() => addSet(ex.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 28 }}
            >
              <Plus size={14} color={colors.accent} />
              <Text style={[type.smallMedium, { color: colors.accent }]}>Add set</Text>
            </Pressable>
          </Card>
        ))}
      </View>

      <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
        <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
          Add an exercise
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <TextInput
            value={newExercise}
            onChangeText={setNewExercise}
            placeholder="e.g. Face pull"
            placeholderTextColor={colors.textFaint}
            onSubmitEditing={addExercise}
            style={[
              type.body,
              {
                flex: 1,
                color: colors.text,
                backgroundColor: colors.track,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          />
          <Button label="Add" small onPress={addExercise} disabled={newExercise.trim().length === 0} />
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button label={`Finish workout (${loggedSets} sets)`} onPress={finish} disabled={loggedSets === 0} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
