import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Card, SectionTitle } from '../src/components/Card';
import { Chip } from '../src/components/Chip';
import { Screen } from '../src/components/Screen';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { Stepper } from '../src/components/Stepper';
import { SPLITS } from '../src/data/splits';
import { ACTIVITY_LABELS, formatWeight, kgToLb, KG_PER_LB, lbToKg } from '../src/lib/nutrition';
import { Activity, DietStyle, Profile, Restriction } from '../src/lib/types';
import { useAppStore, useTargets } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing, type } from '../src/theme/tokens';

const RESTRICTIONS: { value: Restriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'nut-free', label: 'Nut-free' },
];

export default function Settings() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const customSplits = useAppStore((s) => s.customSplits);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const resetAll = useAppStore((s) => s.resetAll);
  const targets = useTargets();

  const imperial = profile.units === 'imperial';
  const weightStep = imperial ? KG_PER_LB : 0.5;
  const paceStep = imperial ? 0.25 * KG_PER_LB : 0.1;
  const toDispWeight = (kg: number) => (imperial ? kgToLb(kg) : kg);
  const fromDispWeight = (v: number) => (imperial ? lbToKg(v) : v);

  const confirmReset = () => {
    const doReset = () => {
      resetAll();
      router.dismissAll();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Erase all data and start over?')) doReset();
    } else {
      Alert.alert('Start over?', 'This erases your profile, plans, and logs.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase everything', style: 'destructive', onPress: doReset },
      ]);
    }
  };

  const LabeledRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
      }}
    >
      <Text style={[type.body, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );

  return (
    <Screen title="Settings" subtitle={`${targets.calories} kcal daily target`}>
      <SectionTitle>Appearance</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        <SegmentedControl
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={themePreference}
          onChange={setThemePreference}
        />
        <SegmentedControl
          options={[
            { value: 'imperial', label: 'lb / ft' },
            { value: 'metric', label: 'kg / cm' },
          ]}
          value={profile.units}
          onChange={(units) => updateProfile({ units })}
        />
      </Card>

      <SectionTitle>Goal</SectionTitle>
      <Card style={{ gap: spacing.lg }}>
        <LabeledRow label="Current weight">
          <Stepper
            value={profile.weightKg}
            min={35}
            max={250}
            step={weightStep}
            format={(v) => formatWeight(v, profile.units)}
            toDisplay={toDispWeight}
            fromDisplay={fromDispWeight}
            onChange={(weightKg) => updateProfile({ weightKg })}
          />
        </LabeledRow>
        <LabeledRow label="Goal weight">
          <Stepper
            value={profile.goalWeightKg}
            min={35}
            max={250}
            step={weightStep}
            format={(v) => formatWeight(v, profile.units)}
            toDisplay={toDispWeight}
            fromDisplay={fromDispWeight}
            onChange={(goalWeightKg) => updateProfile({ goalWeightKg })}
          />
        </LabeledRow>
        <LabeledRow label="Weekly pace">
          <Stepper
            value={profile.paceKgPerWeek}
            min={paceStep}
            max={1.1}
            step={paceStep}
            format={(v) => formatWeight(v, profile.units, imperial ? 2 : 1)}
            toDisplay={toDispWeight}
            fromDisplay={fromDispWeight}
            onChange={(paceKgPerWeek) => updateProfile({ paceKgPerWeek })}
          />
        </LabeledRow>
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.body, { color: colors.textSecondary }]}>Activity</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
              <Chip
                key={a}
                label={ACTIVITY_LABELS[a].title}
                selected={profile.activity === a}
                onPress={() => updateProfile({ activity: a })}
              />
            ))}
          </View>
        </View>
      </Card>

      <SectionTitle>Food</SectionTitle>
      <Card style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.body, { color: colors.textSecondary }]}>Diet style</Text>
          <SegmentedControl
            options={[
              { value: 'strict', label: 'Strict' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'flexible', label: 'Flexible' },
            ]}
            value={profile.dietStyle}
            onChange={(dietStyle: DietStyle) => updateProfile({ dietStyle })}
          />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.body, { color: colors.textSecondary }]}>Restrictions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {RESTRICTIONS.map((r) => {
              const selected = profile.restrictions.includes(r.value);
              return (
                <Chip
                  key={r.value}
                  label={r.label}
                  selected={selected}
                  onPress={() =>
                    updateProfile({
                      restrictions: selected
                        ? profile.restrictions.filter((x) => x !== r.value)
                        : [...profile.restrictions, r.value],
                    })
                  }
                />
              );
            })}
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.body, { color: colors.textSecondary }]}>Meals per day</Text>
          <SegmentedControl
            options={[
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
            ]}
            value={`${profile.mealsPerDay}`}
            onChange={(v) => updateProfile({ mealsPerDay: Number(v) as Profile['mealsPerDay'] })}
          />
        </View>
        <Text style={[type.small, { color: colors.textFaint }]}>
          Changes apply to newly generated days. Use Shuffle on Today to rebuild the current plan.
        </Text>
      </Card>

      <SectionTitle>Training split</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[...SPLITS, ...customSplits].map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              selected={profile.splitId === s.id}
              onPress={() => updateProfile({ splitId: s.id, trainingDaysPerWeek: s.days.length })}
            />
          ))}
        </View>
        <Button
          label="Create a custom split"
          variant="secondary"
          small
          onPress={() => router.push('/edit-split')}
        />
      </Card>

      <View style={{ marginTop: spacing.xxl }}>
        <Button label="Erase all data" variant="danger" onPress={confirmReset} />
      </View>
    </Screen>
  );
}
