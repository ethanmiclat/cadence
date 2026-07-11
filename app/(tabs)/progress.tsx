import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card, SectionTitle } from '../../src/components/Card';
import { HistorySection } from '../../src/components/HistorySection';
import { Screen } from '../../src/components/Screen';
import { WeightChart } from '../../src/components/WeightChart';
import { formatWeight, kgToLb, lbToKg } from '../../src/lib/nutrition';
import { todayKey } from '../../src/lib/planner';
import { useAppStore, useTargets } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius, spacing, type } from '../../src/theme/tokens';

export default function Progress() {
  const { colors } = useTheme();
  const profile = useAppStore((s) => s.profile);
  const weighIns = useAppStore((s) => s.weighIns);
  const addWeighIn = useAppStore((s) => s.addWeighIn);
  const plans = useAppStore((s) => s.plans);
  const logs = useAppStore((s) => s.logs);
  const workouts = useAppStore((s) => s.workouts);
  const shoppingLog = useAppStore((s) => s.shoppingLog);
  const customSplits = useAppStore((s) => s.customSplits);
  const targets = useTargets();
  const [entry, setEntry] = useState('');

  const imperial = profile.units === 'imperial';
  const first = weighIns[0];
  const latest = weighIns[weighIns.length - 1];
  const currentKg = latest?.weightKg ?? profile.weightKg;
  const changeKg = first ? currentKg - first.weightKg : 0;
  const toGoalKg = currentKg - profile.goalWeightKg;

  const submit = () => {
    const value = parseFloat(entry.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return;
    const kg = imperial ? lbToKg(value) : value;
    if (kg < 30 || kg > 300) return;
    addWeighIn({ date: todayKey(), weightKg: kg });
    setEntry('');
  };

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <View style={{ flex: 1 }}>
      <Text style={[type.stat, { color: colors.text }]}>{value}</Text>
      <Text style={[type.label, { color: colors.textFaint }]}>{label}</Text>
    </View>
  );

  return (
    <Screen title="Progress">
      <HistorySection
        data={{ plans, logs, workouts, weighIns, shoppingLog, customSplits }}
        targetCalories={targets.calories}
        units={profile.units}
      />

      <Card style={{ marginTop: spacing.md }}>
        <WeightChart weighIns={weighIns} goalKg={profile.goalWeightKg} units={profile.units} />
        <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.md }}>
          <Stat label="CURRENT" value={formatWeight(currentKg, profile.units, 1)} />
          <Stat
            label="CHANGE"
            value={`${changeKg > 0 ? '+' : ''}${formatWeight(changeKg, profile.units, 1)}`}
          />
          <Stat
            label="TO GOAL"
            value={formatWeight(Math.abs(toGoalKg), profile.units, 1)}
          />
        </View>
      </Card>

      <SectionTitle>Log a weigh-in</SectionTitle>
      <Card style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <TextInput
            value={entry}
            onChangeText={setEntry}
            keyboardType="decimal-pad"
            placeholder={imperial ? `${kgToLb(currentKg).toFixed(1)}` : `${currentKg.toFixed(1)}`}
            placeholderTextColor={colors.textFaint}
            style={[
              type.stat,
              {
                flex: 1,
                color: colors.text,
                backgroundColor: colors.track,
                borderRadius: radius.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              },
            ]}
          />
          <Text style={[type.small, { color: colors.textFaint }]}>
            {imperial ? 'lb' : 'kg'}
          </Text>
          <Button label="Save" small onPress={submit} disabled={entry.trim().length === 0} />
        </View>
      </Card>

      <SectionTitle>Your plan</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Row label="Maintenance (TDEE)" value={`${targets.tdee} kcal`} />
        <Row label="Daily target" value={`${targets.calories} kcal`} />
        <Row
          label={targets.dailyDelta < 0 ? 'Daily deficit' : 'Daily surplus'}
          value={`${Math.abs(targets.dailyDelta)} kcal`}
        />
        {targets.etaWeeks > 0 && (
          <Row
            label="Estimated time to goal"
            value={`${Math.max(1, Math.round(targets.etaWeeks))} weeks`}
          />
        )}
        {targets.floored && (
          <Text style={[type.small, { color: colors.warn }]}>
            Calories were raised to a safe minimum, so the timeline may run longer than your pace
            setting.
          </Text>
        )}
      </Card>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[type.body, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[type.statSmall, { color: colors.text }]}>{value}</Text>
    </View>
  );
}
