import {
  Barbell,
  CaretLeft,
  CaretRight,
  ForkKnife,
  NotePencil,
  Scales,
  ShoppingCart,
} from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  DayActivity,
  HistoryData,
  formatLongDate,
  getDayActivity,
  MONTH_NAMES,
  monthGrid,
} from '../lib/history';
import { formatWeight } from '../lib/nutrition';
import { todayKey } from '../lib/planner';
import { Units } from '../lib/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, type } from '../theme/tokens';
import { Card, SectionTitle } from './Card';
import { Reveal } from './Reveal';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  data: HistoryData;
  targetCalories: number;
  units: Units;
}

export function HistorySection({ data, targetCalories, units }: Props) {
  const { colors } = useTheme();
  const today = todayKey();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(today);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const cellActivity = useMemo(() => {
    const map: Record<string, DayActivity> = {};
    for (const c of cells) if (c) map[c.date] = getDayActivity(c.date, data);
    return map;
  }, [cells, data]);
  const selectedActivity = useMemo(() => getDayActivity(selected, data), [selected, data]);

  // Legend colours, reused for the per-day dots.
  const KIND = {
    food: colors.accent,
    workout: colors.fat,
    weigh: colors.warn,
    shopping: colors.danger,
  };

  const markers = (a: DayActivity | undefined): string[] => {
    if (!a) return [];
    const dots: string[] = [];
    if (a.mealsEaten.length || a.loggedFood.length) dots.push(KIND.food);
    if (a.workout) dots.push(KIND.workout);
    if (a.weighInKg != null) dots.push(KIND.weigh);
    if (a.shoppingCount != null) dots.push(KIND.shopping);
    return dots;
  };

  const changeMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const monthHasFuture = `${year}-${`${month + 1}`.padStart(2, '0')}` >= today.slice(0, 7);

  return (
    <>
      <SectionTitle>History</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {/* Month navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => changeMonth(-1)}
            hitSlop={10}
            accessibilityLabel="Previous month"
            style={navBtn(colors.surfaceRaised)}
          >
            <CaretLeft size={16} color={colors.textSecondary} />
          </Pressable>
          <Text style={[type.bodyMedium, { color: colors.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <Pressable
            onPress={() => changeMonth(1)}
            hitSlop={10}
            accessibilityLabel="Next month"
            disabled={monthHasFuture}
            style={[navBtn(colors.surfaceRaised), { opacity: monthHasFuture ? 0.35 : 1 }]}
          >
            <CaretRight size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Weekday header */}
        <View style={{ flexDirection: 'row' }}>
          {WEEKDAYS.map((w, i) => (
            <Text
              key={i}
              style={[type.label, { color: colors.textFaint, width: `${100 / 7}%`, textAlign: 'center' }]}
            >
              {w}
            </Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((cell, i) => {
            if (!cell) return <View key={`b${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
            const isFuture = cell.date > today;
            const isToday = cell.date === today;
            const isSelected = cell.date === selected;
            const dots = markers(cellActivity[cell.date]);
            return (
              <View key={cell.date} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                <Pressable
                  onPress={() => setSelected(cell.date)}
                  disabled={isFuture}
                  accessibilityLabel={`View ${cell.date}`}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.md,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected
                      ? colors.accent
                      : isToday
                        ? colors.borderStrong
                        : 'transparent',
                    backgroundColor: isSelected ? colors.accentSoft : 'transparent',
                  }}
                >
                  <Text
                    style={[
                      type.statSmall,
                      {
                        color: isFuture
                          ? colors.textFaint
                          : isToday || isSelected
                            ? colors.accent
                            : colors.text,
                        opacity: isFuture ? 0.5 : 1,
                      },
                    ]}
                  >
                    {cell.day}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 2, height: 5, marginTop: 2 }}>
                    {dots.map((c, di) => (
                      <View
                        key={di}
                        style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c }}
                      />
                    ))}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingTop: 2 }}>
          <LegendDot color={KIND.food} label="Food" />
          <LegendDot color={KIND.workout} label="Workout" />
          <LegendDot color={KIND.weigh} label="Weigh-in" />
          <LegendDot color={KIND.shopping} label="Shopping" />
        </View>
      </Card>

      {/* Selected-day detail */}
      <DayDetail
        key={selected}
        activity={selectedActivity}
        isFuture={selected > today}
        isToday={selected === today}
        targetCalories={targetCalories}
        units={units}
      />
    </>
  );
}

function DayDetail({
  activity,
  isFuture,
  isToday,
  targetCalories,
  units,
}: {
  activity: DayActivity;
  isFuture: boolean;
  isToday: boolean;
  targetCalories: number;
  units: Units;
}) {
  const { colors } = useTheme();
  const pct = Math.min(1, activity.calories / Math.max(1, targetCalories));

  return (
    <Reveal>
      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[type.bodyMedium, { color: colors.text, flex: 1 }]}>
            {formatLongDate(activity.date)}
          </Text>
          {isToday && (
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: radius.pill,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Text style={[type.label, { color: colors.accent }]}>TODAY</Text>
            </View>
          )}
        </View>

        {isFuture ? (
          <Text style={[type.body, { color: colors.textFaint }]}>
            This day hasn’t happened yet.
          </Text>
        ) : !activity.active ? (
          <Text style={[type.body, { color: colors.textFaint }]}>
            Nothing recorded on this day.
          </Text>
        ) : (
          <>
            {/* Calories */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[type.small, { color: colors.textSecondary }]}>Calories eaten</Text>
                <Text style={[type.statSmall, { color: colors.text }]}>
                  {activity.calories} / {targetCalories} kcal
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.track }}>
                <View
                  style={{
                    width: `${pct * 100}%`,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.accent,
                  }}
                />
              </View>
              {(activity.protein > 0 || activity.carbs > 0 || activity.fat > 0) && (
                <View style={{ flexDirection: 'row', gap: spacing.lg, paddingTop: 2 }}>
                  <MacroStat label="Protein" grams={activity.protein} color={colors.protein} />
                  <MacroStat label="Carbs" grams={activity.carbs} color={colors.carbs} />
                  <MacroStat label="Fat" grams={activity.fat} color={colors.fat} />
                </View>
              )}
            </View>

            {activity.mealsEaten.length > 0 && (
              <DetailBlock icon={<ForkKnife size={16} color={colors.accent} />} title="Meals eaten">
                {activity.mealsEaten.map((m, i) => (
                  <LineItem key={i} name={m.name} trailing={`${m.calories} kcal`} />
                ))}
              </DetailBlock>
            )}

            {activity.loggedFood.length > 0 && (
              <DetailBlock icon={<NotePencil size={16} color={colors.accent} />} title="Logged food">
                {activity.loggedFood.map((m, i) => (
                  <LineItem key={i} name={m.name} trailing={`${m.calories} kcal`} />
                ))}
              </DetailBlock>
            )}

            {activity.workout && (
              <DetailBlock icon={<Barbell size={16} color={colors.fat} />} title="Workout">
                <LineItem
                  name={
                    activity.workout.focus
                      ? `${activity.workout.name} · ${activity.workout.focus}`
                      : activity.workout.name
                  }
                  trailing={activity.workout.completed ? 'Done' : 'Partial'}
                />
                <Text style={[type.small, { color: colors.textFaint }]}>
                  {activity.workout.exercises} exercises · {activity.workout.sets} sets logged
                </Text>
              </DetailBlock>
            )}

            {activity.weighInKg != null && (
              <DetailBlock icon={<Scales size={16} color={colors.warn} />} title="Weigh-in">
                <LineItem name="Body weight" trailing={formatWeight(activity.weighInKg, units, 1)} />
              </DetailBlock>
            )}

            {activity.shoppingCount != null && (
              <DetailBlock icon={<ShoppingCart size={16} color={colors.danger} />} title="Shopping">
                <LineItem
                  name="Shopping trip"
                  trailing={`${activity.shoppingCount} item${activity.shoppingCount === 1 ? '' : 's'}`}
                />
              </DetailBlock>
            )}
          </>
        )}
      </Card>
    </Reveal>
  );
}

function DetailBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function LineItem({ name, trailing }: { name: string; trailing: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text style={[type.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[type.statSmall, { color: colors.textSecondary }]}>{trailing}</Text>
    </View>
  );
}

function MacroStat({ label, grams, color }: { label: string; grams: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={[type.statSmall, { color: colors.text }]}>{grams}g</Text>
      <Text style={[type.small, { color: colors.textFaint }]}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={[type.small, { color: colors.textFaint }]}>{label}</Text>
    </View>
  );
}

function navBtn(bg: string) {
  return {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: bg,
  };
}
