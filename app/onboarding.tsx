import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Chip } from '../src/components/Chip';
import { Screen } from '../src/components/Screen';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { Stepper } from '../src/components/Stepper';
import {
  ACTIVITY_LABELS,
  CM_PER_IN,
  computeTargets,
  formatHeight,
  formatWeight,
  kgToLb,
  KG_PER_LB,
  lbToKg,
} from '../src/lib/nutrition';
import { Activity, DietStyle, Profile, Restriction } from '../src/lib/types';
import { SPLITS } from '../src/data/splits';
import { DEFAULT_PROFILE, useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeContext';
import { radius, spacing, type } from '../src/theme/tokens';

const STEPS = ['Basics', 'Body', 'Goal', 'Food', 'Training'] as const;

const RESTRICTIONS: { value: Restriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'nut-free', label: 'Nut-free' },
];

function Field({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[type.label, { color, textTransform: 'uppercase' }]}>{label}</Text>
      {children}
    </View>
  );
}

const DIET_STYLES: { value: DietStyle; title: string; detail: string }[] = [
  { value: 'strict', title: 'Strict', detail: 'Whole foods only, no shortcuts' },
  { value: 'balanced', title: 'Balanced', detail: 'Mostly clean with room to breathe' },
  { value: 'flexible', title: 'Flexible', detail: 'Anything that fits the numbers' },
];

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const patch = (p: Partial<Profile>) => setDraft((d) => ({ ...d, ...p }));

  const imperial = draft.units === 'imperial';
  const targets = useMemo(() => computeTargets(draft), [draft]);
  const losing = draft.goalWeightKg < draft.weightKg;
  const gaining = draft.goalWeightKg > draft.weightKg;

  const weightStep = imperial ? KG_PER_LB : 0.5;
  const paceStep = imperial ? 0.25 * KG_PER_LB : 0.1;

  const toDispWeight = (kg: number) => (imperial ? kgToLb(kg) : kg);
  const fromDispWeight = (v: number) => (imperial ? lbToKg(v) : v);
  const toDispHeight = (cm: number) => (imperial ? cm / CM_PER_IN : cm);
  const fromDispHeight = (v: number) => (imperial ? v * CM_PER_IN : v);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding(draft);
      router.replace('/today');
    }
  };

  return (
    <Screen scroll padded>
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 3,
              borderRadius: radius.pill,
              backgroundColor: i <= step ? colors.accent : colors.track,
            }}
          />
        ))}
      </View>
      <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
        Step {step + 1} of {STEPS.length}
      </Text>
      <Text style={[type.display, { color: colors.text, marginBottom: spacing.xl }]}>
        {step === 0 && 'Welcome to Cadence'}
        {step === 1 && 'About your body'}
        {step === 2 && 'Where are you headed?'}
        {step === 3 && 'How you like to eat'}
        {step === 4 && 'How you like to train'}
      </Text>

      {step === 0 && (
        <View style={styles.stack}>
          <Field label="Your name" color={colors.textFaint}>
            <TextInput
              value={draft.name}
              onChangeText={(name) => patch({ name })}
              placeholder="First name"
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
          </Field>
          <Field label="Units" color={colors.textFaint}>
            <SegmentedControl
              options={[
                { value: 'imperial', label: 'lb / ft' },
                { value: 'metric', label: 'kg / cm' },
              ]}
              value={draft.units}
              onChange={(units) => patch({ units })}
            />
          </Field>
        </View>
      )}

      {step === 1 && (
        <View style={styles.stack}>
          <Field label="Sex (for calorie math)" color={colors.textFaint}>
            <SegmentedControl
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              value={draft.sex}
              onChange={(sex) => patch({ sex })}
            />
          </Field>
          <Field label="Age" color={colors.textFaint}>
            <Stepper value={draft.age} min={14} max={90} onChange={(age) => patch({ age })} />
          </Field>
          <Field label="Height" color={colors.textFaint}>
            <Stepper
              value={draft.heightCm}
              min={130}
              max={220}
              step={imperial ? CM_PER_IN : 1}
              format={(v) => formatHeight(v, draft.units)}
              toDisplay={toDispHeight}
              fromDisplay={fromDispHeight}
              onChange={(heightCm) => patch({ heightCm })}
            />
          </Field>
          <Field label="Current weight" color={colors.textFaint}>
            <Stepper
              value={draft.weightKg}
              min={35}
              max={250}
              step={weightStep}
              format={(v) => formatWeight(v, draft.units)}
              toDisplay={toDispWeight}
              fromDisplay={fromDispWeight}
              onChange={(weightKg) => patch({ weightKg })}
            />
          </Field>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stack}>
          <Field label="Goal weight" color={colors.textFaint}>
            <Stepper
              value={draft.goalWeightKg}
              min={35}
              max={250}
              step={weightStep}
              format={(v) => formatWeight(v, draft.units)}
              toDisplay={toDispWeight}
              fromDisplay={fromDispWeight}
              onChange={(goalWeightKg) => patch({ goalWeightKg })}
            />
          </Field>
          {(losing || gaining) && (
            <Field label={losing ? 'Weekly loss pace' : 'Weekly gain pace'} color={colors.textFaint}>
              <Stepper
                value={draft.paceKgPerWeek}
                min={paceStep}
                max={1.1}
                step={paceStep}
                format={(v) => `${formatWeight(v, draft.units, imperial ? 2 : 1)}/wk`}
                toDisplay={toDispWeight}
                fromDisplay={fromDispWeight}
                onChange={(paceKgPerWeek) => patch({ paceKgPerWeek })}
              />
            </Field>
          )}
          <Field label="Activity level" color={colors.textFaint}>
            <View style={styles.stackSm}>
              {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                <Card
                  key={a}
                  onPress={() => patch({ activity: a })}
                  style={{
                    borderColor: draft.activity === a ? colors.accent : colors.border,
                    backgroundColor: draft.activity === a ? colors.accentSoft : colors.surface,
                    padding: spacing.md,
                  }}
                >
                  <Text style={[type.bodyMedium, { color: colors.text }]}>
                    {ACTIVITY_LABELS[a].title}
                  </Text>
                  <Text style={[type.small, { color: colors.textSecondary }]}>
                    {ACTIVITY_LABELS[a].detail}
                  </Text>
                </Card>
              ))}
            </View>
          </Field>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stack}>
          <Field label="Diet style" color={colors.textFaint}>
            <View style={styles.stackSm}>
              {DIET_STYLES.map((d) => (
                <Card
                  key={d.value}
                  onPress={() => patch({ dietStyle: d.value })}
                  style={{
                    borderColor: draft.dietStyle === d.value ? colors.accent : colors.border,
                    backgroundColor:
                      draft.dietStyle === d.value ? colors.accentSoft : colors.surface,
                    padding: spacing.md,
                  }}
                >
                  <Text style={[type.bodyMedium, { color: colors.text }]}>{d.title}</Text>
                  <Text style={[type.small, { color: colors.textSecondary }]}>{d.detail}</Text>
                </Card>
              ))}
            </View>
          </Field>
          <Field label="Restrictions (optional)" color={colors.textFaint}>
            <View style={styles.wrap}>
              {RESTRICTIONS.map((r) => {
                const selected = draft.restrictions.includes(r.value);
                return (
                  <Chip
                    key={r.value}
                    label={r.label}
                    selected={selected}
                    onPress={() =>
                      patch({
                        restrictions: selected
                          ? draft.restrictions.filter((x) => x !== r.value)
                          : [...draft.restrictions, r.value],
                      })
                    }
                  />
                );
              })}
            </View>
          </Field>
          <Field label="Meals per day" color={colors.textFaint}>
            <SegmentedControl
              options={[
                { value: '3', label: '3 meals' },
                { value: '4', label: '4 meals' },
                { value: '5', label: '5 meals' },
              ]}
              value={`${draft.mealsPerDay}`}
              onChange={(v) => patch({ mealsPerDay: Number(v) as Profile['mealsPerDay'] })}
            />
          </Field>
        </View>
      )}

      {step === 4 && (
        <View style={styles.stack}>
          <Field label="Training split" color={colors.textFaint}>
            <View style={styles.stackSm}>
              {SPLITS.map((s) => (
                <Card
                  key={s.id}
                  onPress={() => patch({ splitId: s.id, trainingDaysPerWeek: s.days.length })}
                  style={{
                    borderColor: draft.splitId === s.id ? colors.accent : colors.border,
                    backgroundColor: draft.splitId === s.id ? colors.accentSoft : colors.surface,
                    padding: spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[type.bodyMedium, { color: colors.text }]}>{s.name}</Text>
                    <Text style={[type.smallMedium, { color: colors.textFaint }]}>
                      {s.daysPerWeek}
                    </Text>
                  </View>
                  <Text style={[type.small, { color: colors.textSecondary }]}>{s.description}</Text>
                </Card>
              ))}
            </View>
          </Field>

          <Card>
            <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
              Your daily plan
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
              <Text style={[type.statLarge, { color: colors.text }]}>{targets.calories}</Text>
              <Text style={[type.small, { color: colors.textSecondary }]}>kcal / day</Text>
            </View>
            <Text style={[type.small, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {targets.protein}g protein · {targets.carbs}g carbs · {targets.fat}g fat
            </Text>
            {targets.etaWeeks > 0 && (
              <Text style={[type.small, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                On pace to reach {formatWeight(draft.goalWeightKg, draft.units)} in about{' '}
                {Math.round(targets.etaWeeks)} weeks.
              </Text>
            )}
            {targets.floored && (
              <Text style={[type.small, { color: colors.warn, marginTop: spacing.xs }]}>
                We raised your calories to a safe minimum — a gentler pace will be more sustainable.
              </Text>
            )}
          </Card>
        </View>
      )}

      <View style={styles.footer}>
        {step > 0 && (
          <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} />
        )}
        <Button
          label={step === STEPS.length - 1 ? "Let's go" : 'Continue'}
          onPress={next}
          disabled={step === 0 && draft.name.trim().length === 0}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 6, marginBottom: spacing.xl },
  stack: { gap: spacing.xl },
  stackSm: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { gap: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
});
