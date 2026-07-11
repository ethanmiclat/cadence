import { allSplits, Split, SplitDay } from '../data/splits';
import { getMeal } from '../data/meals';
import { consumedTotals, slotMacros } from './planner';
import { DayPlan, LoggedEntry, WeighIn, WorkoutLog } from './types';

export interface HistoryData {
  plans: Record<string, DayPlan>;
  logs: Record<string, LoggedEntry[]>;
  workouts: WorkoutLog[];
  weighIns: WeighIn[];
  shoppingLog: Record<string, number>;
  customSplits: Split[];
}

export interface DayActivity {
  date: string;
  /** total calories actually consumed: meals marked eaten + logged food */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsEaten: { name: string; calories: number }[];
  loggedFood: { name: string; calories: number }[];
  workout?: {
    name: string;
    focus: string;
    exercises: number;
    sets: number;
    completed: boolean;
  };
  weighInKg?: number;
  shoppingCount?: number;
  /** true if anything at all was recorded that day */
  active: boolean;
}

function findSplitDay(splitDayId: string, customSplits: Split[]): SplitDay | undefined {
  for (const s of allSplits(customSplits)) {
    const d = s.days.find((day) => day.id === splitDayId);
    if (d) return d;
  }
  return undefined;
}

export function getDayActivity(date: string, data: HistoryData): DayActivity {
  const plan = data.plans[date];
  const entries = data.logs[date] ?? [];
  const consumed = consumedTotals(plan, entries);

  const mealsEaten =
    plan?.slots
      .filter((s) => s.status === 'eaten')
      .map((s) => ({
        name: getMeal(s.mealId)?.name ?? 'Meal',
        calories: slotMacros(s).calories,
      })) ?? [];

  const loggedFood = entries.map((e) => ({ name: e.name, calories: e.calories }));

  const w = data.workouts.find((x) => x.date === date);
  const day = w ? findSplitDay(w.splitDayId, data.customSplits) : undefined;
  const workout = w
    ? {
        name: day?.name ?? 'Workout',
        focus: day?.focus ?? '',
        exercises: w.exercises.length,
        sets: w.exercises.reduce((n, ex) => n + ex.sets.length, 0),
        completed: w.completed,
      }
    : undefined;

  const weighInKg = data.weighIns.find((x) => x.date === date)?.weightKg;
  const shoppingCount = data.shoppingLog[date];

  const active =
    mealsEaten.length > 0 ||
    loggedFood.length > 0 ||
    !!workout ||
    weighInKg != null ||
    shoppingCount != null;

  return {
    date,
    calories: consumed.calories,
    protein: consumed.protein,
    carbs: consumed.carbs,
    fat: consumed.fat,
    mealsEaten,
    loggedFood,
    workout,
    weighInKg,
    shoppingCount,
    active,
  };
}

export interface CalendarCell {
  date: string;
  day: number;
}

/** A month laid out as weeks (Mon-first), with leading blanks as null. */
export function monthGrid(year: number, month: number): (CalendarCell | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (CalendarCell | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${`${month + 1}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`;
    cells.push({ date, day: d });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatLongDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    dt.getDay()
  ];
  return `${weekday}, ${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
}
