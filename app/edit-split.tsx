import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Trash } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Card, SectionTitle } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { Exercise, Split, SplitDay } from '../src/data/splits';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeContext';
import { radius, spacing, type } from '../src/theme/tokens';

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${seq++}`;

function emptyDay(): SplitDay {
  return { id: uid('day'), name: 'Day 1', focus: 'Full body', exercises: [emptyExercise()] };
}
function emptyExercise(): Exercise {
  return { id: uid('ex'), name: '', sets: 3, reps: '8-12' };
}

export default function EditSplit() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const customSplits = useAppStore((s) => s.customSplits);
  const addCustomSplit = useAppStore((s) => s.addCustomSplit);
  const updateCustomSplit = useAppStore((s) => s.updateCustomSplit);
  const deleteCustomSplit = useAppStore((s) => s.deleteCustomSplit);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const existing = useMemo(() => customSplits.find((s) => s.id === id), [customSplits, id]);
  const [name, setName] = useState(existing?.name ?? 'My split');
  const [days, setDays] = useState<SplitDay[]>(existing ? existing.days : [emptyDay()]);

  const patchDay = (dayId: string, patch: Partial<SplitDay>) =>
    setDays((ds) => ds.map((d) => (d.id === dayId ? { ...d, ...patch } : d)));

  const patchExercise = (dayId: string, exId: string, patch: Partial<Exercise>) =>
    setDays((ds) =>
      ds.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) }
          : d
      )
    );

  const addExercise = (dayId: string) =>
    patchDay(dayId, { exercises: [...days.find((d) => d.id === dayId)!.exercises, emptyExercise()] });

  const removeExercise = (dayId: string, exId: string) =>
    setDays((ds) =>
      ds.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
      )
    );

  const addDay = () =>
    setDays((ds) => [...ds, { ...emptyDay(), name: `Day ${ds.length + 1}` }]);

  const removeDay = (dayId: string) => setDays((ds) => ds.filter((d) => d.id !== dayId));

  const canSave =
    name.trim().length > 0 &&
    days.length > 0 &&
    days.every((d) => d.exercises.some((e) => e.name.trim().length > 0));

  const save = () => {
    const cleaned: Split = {
      id: existing?.id ?? uid('custom'),
      name: name.trim(),
      daysPerWeek: `${days.length} day${days.length === 1 ? '' : 's'}`,
      description: 'Custom split',
      days: days.map((d) => ({
        ...d,
        name: d.name.trim() || 'Day',
        focus: d.focus.trim() || 'Training',
        exercises: d.exercises
          .filter((e) => e.name.trim().length > 0)
          .map((e) => ({ ...e, name: e.name.trim() })),
      })),
    };
    if (existing) updateCustomSplit(cleaned);
    else addCustomSplit(cleaned);
    updateProfile({ splitId: cleaned.id, trainingDaysPerWeek: cleaned.days.length });
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    const doDelete = () => {
      deleteCustomSplit(existing.id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${existing.name}"?`)) doDelete();
    } else {
      Alert.alert('Delete split?', `"${existing.name}" will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const input = (value: string, onChangeText: (v: string) => void, placeholder: string, flex = 1) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      style={[
        type.body,
        {
          flex,
          color: colors.text,
          backgroundColor: colors.track,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    />
  );

  return (
    <Screen title={existing ? 'Edit workout' : 'New workout'} subtitle="Build your own split">
      <View style={{ gap: 6 }}>
        <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
          Split name
        </Text>
        {input(name, setName, 'e.g. My PPL')}
      </View>

      {days.map((day, di) => (
        <View key={day.id}>
          <SectionTitle
            right={
              days.length > 1 ? (
                <Pressable onPress={() => removeDay(day.id)} hitSlop={8}>
                  <Trash size={17} color={colors.danger} />
                </Pressable>
              ) : undefined
            }
          >
            {`Day ${di + 1}`}
          </SectionTitle>
          <Card style={{ gap: spacing.md, padding: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {input((day.name), (v) => patchDay(day.id, { name: v }), 'Name', 1.2)}
              {input(day.focus, (v) => patchDay(day.id, { focus: v }), 'Focus', 1)}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Text style={[type.label, { color: colors.textFaint, flex: 2.4 }]}>EXERCISE</Text>
              <Text style={[type.label, { color: colors.textFaint, width: 44, textAlign: 'center' }]}>
                SETS
              </Text>
              <Text style={[type.label, { color: colors.textFaint, width: 66, textAlign: 'center' }]}>
                REPS
              </Text>
              <View style={{ width: 20 }} />
            </View>

            {day.exercises.map((ex) => (
              <View key={ex.id} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                {input(ex.name, (v) => patchExercise(day.id, ex.id, { name: v }), 'Exercise', 2.4)}
                <TextInput
                  value={`${ex.sets}`}
                  onChangeText={(v) =>
                    patchExercise(day.id, ex.id, { sets: Math.max(1, parseInt(v, 10) || 1) })
                  }
                  keyboardType="number-pad"
                  style={[
                    type.body,
                    {
                      width: 44,
                      textAlign: 'center',
                      color: colors.text,
                      backgroundColor: colors.track,
                      borderRadius: radius.sm,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                />
                <TextInput
                  value={ex.reps}
                  onChangeText={(v) => patchExercise(day.id, ex.id, { reps: v })}
                  placeholder="8-12"
                  placeholderTextColor={colors.textFaint}
                  style={[
                    type.body,
                    {
                      width: 66,
                      textAlign: 'center',
                      color: colors.text,
                      backgroundColor: colors.track,
                      borderRadius: radius.sm,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => removeExercise(day.id, ex.id)}
                  hitSlop={6}
                  style={{ width: 20, alignItems: 'center' }}
                  disabled={day.exercises.length === 1}
                >
                  <Trash
                    size={16}
                    color={day.exercises.length === 1 ? colors.borderStrong : colors.textFaint}
                  />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={() => addExercise(day.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Plus size={15} color={colors.accent} />
              <Text style={[type.smallMedium, { color: colors.accent }]}>Add exercise</Text>
            </Pressable>
          </Card>
        </View>
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <Button
          label="Add another day"
          variant="ghost"
          icon={<Plus size={18} color={colors.accent} weight="bold" />}
          onPress={addDay}
        />
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <Button label={existing ? 'Save changes' : 'Create split'} onPress={save} disabled={!canSave} />
        {existing && <Button label="Delete split" variant="danger" onPress={confirmDelete} />}
      </View>
    </Screen>
  );
}
