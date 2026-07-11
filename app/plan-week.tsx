import { useRouter } from 'expo-router';
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  CalendarCheck,
  CaretDown,
  CaretRight,
  CheckCircle,
  MagnifyingGlass,
  PencilSimple,
  X,
} from 'phosphor-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Card, SectionTitle } from '../src/components/Card';
import { Chip } from '../src/components/Chip';
import { Reveal } from '../src/components/Reveal';
import { Screen } from '../src/components/Screen';
import { Stepper } from '../src/components/Stepper';
import { getMeal } from '../src/data/meals';
import { formatMoney, mealCost } from '../src/lib/cost';
import { computeTargets } from '../src/lib/nutrition';
import {
  addDays,
  alternativesFor,
  buildDayPlan,
  buildWeek,
  dayCost,
  filteredAlternatives,
  planTotals,
  PlannerFilters,
  rescaleDay,
  todayKey,
} from '../src/lib/planner';
import { DayPlan, MealType } from '../src/lib/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeContext';
import { radius, spacing, type } from '../src/theme/tokens';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlanWeek() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setDayPlan = useAppStore((s) => s.setDayPlan);

  const start = todayKey();
  const targets = useMemo(() => computeTargets(profile), [profile]);

  // A realistic starting budget = what an unconstrained week costs, rounded up,
  // so the default state is achievable rather than instantly "over budget".
  const baselineCost = useMemo(
    () => Math.max(35, Math.ceil(buildWeek(profile, targets, start, {}, 0).totalCost / 5) * 5),
    [profile, targets, start]
  );
  // The cheapest a full week can be while still hitting the calorie target.
  const floorCost = useMemo(
    () => buildWeek(profile, targets, start, { weeklyBudget: 1 }, 0).totalCost,
    [profile, targets, start]
  );

  const [budget, setBudget] = useState(baselineCost);
  const [useBudget, setUseBudget] = useState(true);
  const [maxMinutes, setMaxMinutes] = useState(30);
  const [useMaxMinutes, setUseMaxMinutes] = useState(false);
  const [quickOnly, setQuickOnly] = useState(false);
  const [highProtein, setHighProtein] = useState(false);
  const [budgetFriendlyOnly, setBudgetFriendlyOnly] = useState(false);
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [noRepeats, setNoRepeats] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [picker, setPicker] = useState<{
    dayIndex: number;
    slotId: string;
    label: string;
    type: MealType;
  } | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  const filters: PlannerFilters = useMemo(
    () => ({
      weeklyBudget: useBudget ? budget : undefined,
      maxMinutes: useMaxMinutes && !quickOnly ? maxMinutes : undefined,
      quickOnly,
      highProtein,
      budgetFriendlyOnly,
      vegetarianOnly,
      noRepeats,
    }),
    [
      useBudget,
      budget,
      useMaxMinutes,
      maxMinutes,
      quickOnly,
      highProtein,
      budgetFriendlyOnly,
      vegetarianOnly,
      noRepeats,
    ]
  );
  const filtersKey = JSON.stringify(filters);

  const [days, setDays] = useState<DayPlan[]>(
    () => buildWeek(profile, targets, start, filters, nonce).days
  );

  // Regenerating on a filter change or a full reshuffle discards manual edits.
  useEffect(() => {
    setDays(buildWeek(profile, targets, start, filters, nonce).days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, nonce]);

  const dailyCost = useMemo(() => days.map(dayCost), [days]);
  const totalCost = dailyCost.reduce((a, b) => a + b, 0);
  const overBudget = useBudget && totalCost > budget + 0.5;

  const reshuffleDay = (i: number) =>
    setDays((prev) =>
      prev.map((d, idx) =>
        idx === i
          ? buildDayPlan(profile, targets, d.date, Math.floor(Math.random() * 1e6), filters)
          : d
      )
    );

  const swapMeal = (i: number, slotId: string) =>
    setDays((prev) =>
      prev.map((d, idx) => {
        if (idx !== i) return d;
        const slot = d.slots.find((s) => s.id === slotId);
        const current = slot && getMeal(slot.mealId);
        if (!slot || !current) return d;
        const others = d.slots.filter((s) => s.id !== slotId).map((s) => s.mealId);
        const alts = filteredAlternatives(profile, current.type, filters, others);
        if (alts.length === 0) return d;
        const at = alts.findIndex((m) => m.id === slot.mealId);
        const next = alts[(at + 1) % alts.length];
        const slots = d.slots.map((s) => (s.id === slotId ? { ...s, mealId: next.id } : s));
        return rescaleDay({ ...d, slots }, targets);
      })
    );

  const openPicker = (i: number, slotId: string, label: string, type: MealType) => {
    setPickerQuery('');
    setPicker({ dayIndex: i, slotId, label, type });
  };

  const chooseMeal = (mealId: string) => {
    if (!picker) return;
    const { dayIndex, slotId } = picker;
    setDays((prev) =>
      prev.map((d, idx) => {
        if (idx !== dayIndex) return d;
        const slots = d.slots.map((s) => (s.id === slotId ? { ...s, mealId } : s));
        return rescaleDay({ ...d, slots }, targets);
      })
    );
    setPicker(null);
  };

  // Eligible meals for the slot being edited: any meal of that type that fits the
  // diet, minus what's already on the plate that day (so no accidental repeats),
  // narrowed by the search box. The optional planner filters aren't applied here
  // on purpose — this is a manual override where the user picks exactly what they want.
  const pickerOptions = useMemo(() => {
    if (!picker) return [];
    const day = days[picker.dayIndex];
    if (!day) return [];
    const others = day.slots
      .filter((s) => s.id !== picker.slotId)
      .map((s) => s.mealId);
    const q = pickerQuery.trim().toLowerCase();
    return alternativesFor(profile, picker.type, others).filter(
      (m) => !q || m.name.toLowerCase().includes(q)
    );
  }, [picker, days, profile, pickerQuery]);

  const pickerCurrentId = picker
    ? days[picker.dayIndex]?.slots.find((s) => s.id === picker.slotId)?.mealId
    : undefined;

  const saveWeek = () => {
    days.forEach((day) => setDayPlan(day));
    setSaved(true);
    setTimeout(() => router.back(), 700);
  };

  const dayLabel = (i: number) => {
    const d = new Date(`${addDays(start, i)}T00:00:00`);
    return WEEKDAYS[(d.getDay() + 6) % 7];
  };

  return (
    <>
    <Screen title="Plan my week" subtitle="7 days, your rules">
      <SectionTitle>Filters</SectionTitle>
      <Card style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <View style={styles_row()}>
            <Text style={[type.body, { color: colors.text }]}>Weekly budget</Text>
            <Chip label={useBudget ? 'On' : 'Off'} selected={useBudget} onPress={() => setUseBudget(!useBudget)} />
          </View>
          {useBudget && (
            <View style={{ alignItems: 'center', paddingTop: spacing.xs }}>
              <Stepper value={budget} min={30} max={250} step={5} format={(v) => formatMoney(v)} onChange={setBudget} />
            </View>
          )}
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        <View style={{ gap: spacing.sm }}>
          <View style={styles_row()}>
            <Text style={[type.body, { color: colors.text }]}>Cap cook time</Text>
            <Chip
              label={useMaxMinutes ? 'On' : 'Off'}
              selected={useMaxMinutes}
              onPress={() => setUseMaxMinutes(!useMaxMinutes)}
            />
          </View>
          {useMaxMinutes && (
            <View style={{ alignItems: 'center', paddingTop: spacing.xs }}>
              <Stepper value={maxMinutes} min={10} max={60} step={5} format={(v) => `${v} min`} onChange={setMaxMinutes} />
            </View>
          )}
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Chip label="Quick meals only (≤15 min)" selected={quickOnly} onPress={() => setQuickOnly(!quickOnly)} />
          <Chip label="High protein" selected={highProtein} onPress={() => setHighProtein(!highProtein)} />
          <Chip
            label="Budget-friendly meals"
            selected={budgetFriendlyOnly}
            onPress={() => setBudgetFriendlyOnly(!budgetFriendlyOnly)}
          />
          <Chip
            label="Vegetarian"
            selected={vegetarianOnly}
            onPress={() => setVegetarianOnly(!vegetarianOnly)}
          />
          <Chip
            label="No repeat meals"
            selected={noRepeats}
            onPress={() => setNoRepeats(!noRepeats)}
          />
        </View>
      </Card>

      <SectionTitle
        right={
          <Pressable
            onPress={() => setNonce((n) => n + 1)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <ArrowsClockwise size={15} color={colors.accent} />
            <Text style={[type.smallMedium, { color: colors.accent }]}>Reshuffle all</Text>
          </Pressable>
        }
      >
        Your week
      </SectionTitle>

      <Card style={{ gap: spacing.sm }}>
        <View style={styles_row()}>
          <Text style={[type.label, { color: colors.textFaint }]}>ESTIMATED TOTAL</Text>
          <Text style={[type.statSmall, { color: overBudget ? colors.warn : colors.accent }]}>
            {formatMoney(totalCost)}
            {useBudget ? ` / ${formatMoney(budget)}` : ''}
          </Text>
        </View>
        <Text style={[type.small, { color: overBudget ? colors.warn : colors.textFaint }]}>
          {overBudget
            ? `The cheapest full week that still hits your calories is about ${formatMoney(
                floorCost
              )}. Lower your calorie target or meals per day to spend less.`
            : useBudget
              ? 'Meals were chosen to fit your budget while hitting your calorie target.'
              : 'Tap a day to reshuffle it or swap individual meals.'}
        </Text>
      </Card>

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {days.map((day, i) => {
          const kcal = planTotals(day, 'planned').calories;
          const isOpen = expanded === i;
          return (
            <Card key={day.date} style={{ padding: spacing.md, gap: isOpen ? spacing.md : 6 }}>
              <Pressable
                onPress={() => setExpanded(isOpen ? null : i)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                {isOpen ? (
                  <CaretDown size={16} color={colors.textFaint} />
                ) : (
                  <CaretRight size={16} color={colors.textFaint} />
                )}
                <Text style={[type.bodyMedium, { color: colors.text, flex: 1 }]}>{dayLabel(i)}</Text>
                <Text style={[type.statSmall, { color: colors.textSecondary }]}>
                  {kcal} kcal · {formatMoney(dailyCost[i])}
                </Text>
              </Pressable>

              {!isOpen && (
                <Text style={[type.small, { color: colors.textFaint, paddingLeft: 24 }]} numberOfLines={2}>
                  {day.slots.map((s) => getMeal(s.mealId)?.name).filter(Boolean).join(' · ')}
                </Text>
              )}

              {isOpen && (
                <Reveal style={{ gap: spacing.sm }}>
                  {day.slots.map((slot) => {
                    const meal = getMeal(slot.mealId);
                    if (!meal) return null;
                    return (
                      <View
                        key={slot.id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                      >
                        <Pressable
                          onPress={() => openPicker(i, slot.id, slot.label, meal.type)}
                          accessibilityLabel={`Choose ${slot.label}`}
                          style={{ flex: 1 }}
                        >
                          <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
                            {slot.label}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text
                              style={[type.bodyMedium, { color: colors.text, flexShrink: 1 }]}
                              numberOfLines={1}
                            >
                              {meal.name}
                            </Text>
                            <PencilSimple size={13} color={colors.textFaint} />
                          </View>
                          <Text style={[type.statSmall, { color: colors.textSecondary }]}>
                            {Math.round(meal.calories * slot.scale)} kcal ·{' '}
                            {formatMoney(mealCost(meal) * slot.scale)}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => swapMeal(i, slot.id)}
                          hitSlop={8}
                          accessibilityLabel={`Shuffle ${slot.label}`}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: radius.pill,
                            backgroundColor: colors.accentSoft,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ArrowsLeftRight size={17} color={colors.accent} />
                        </Pressable>
                      </View>
                    );
                  })}
                  <Pressable
                    onPress={() => reshuffleDay(i)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      paddingTop: spacing.sm,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <ArrowsClockwise size={15} color={colors.accent} />
                    <Text style={[type.smallMedium, { color: colors.accent }]}>Reshuffle this day</Text>
                  </Pressable>
                </Reveal>
              )}
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          label={saved ? 'Saved!' : 'Use this week'}
          icon={
            saved ? (
              <CheckCircle size={18} color={colors.onAccent} weight="fill" />
            ) : (
              <CalendarCheck size={18} color={colors.onAccent} />
            )
          }
          onPress={saveWeek}
        />
      </View>
    </Screen>

      <Modal
        visible={!!picker}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable
          onPress={() => setPicker(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              maxHeight: '82%',
              backgroundColor: colors.bg,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              paddingTop: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.xl,
            }}
          >
            <View style={[styles_row(), { marginBottom: spacing.md }]}>
              <View>
                <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
                  Choose a meal
                </Text>
                <Text style={[type.title, { color: colors.text }]}>{picker?.label}</Text>
              </View>
              <Pressable
                onPress={() => setPicker(null)}
                hitSlop={8}
                accessibilityLabel="Close meal picker"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radius.pill,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <MagnifyingGlass size={18} color={colors.textFaint} />
              <TextInput
                value={pickerQuery}
                onChangeText={setPickerQuery}
                placeholder="Search meals"
                placeholderTextColor={colors.textFaint}
                autoFocus
                style={[type.body, { color: colors.text, flex: 1, paddingVertical: spacing.md }]}
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
              <View style={{ gap: spacing.sm }}>
                {pickerOptions.length === 0 && (
                  <Text style={[type.body, { color: colors.textFaint, paddingVertical: spacing.md }]}>
                    No meals match “{pickerQuery}”.
                  </Text>
                )}
                {pickerOptions.map((m) => {
                  const isCurrent = m.id === pickerCurrentId;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => chooseMeal(m.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: spacing.md,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: isCurrent ? colors.accent : colors.border,
                        backgroundColor: isCurrent ? colors.accentSoft : colors.surface,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={1}>
                          {m.name}
                        </Text>
                        <Text style={[type.statSmall, { color: colors.textSecondary }]}>
                          {m.calories} kcal · {m.protein}g protein · {formatMoney(mealCost(m))}
                        </Text>
                      </View>
                      {isCurrent && <CheckCircle size={20} color={colors.accent} weight="fill" />}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function styles_row() {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  };
}
