import { MEALS, getMeal } from '../data/meals';
import { isBudgetFriendly, mealCost } from './cost';
import { customizedMeal } from './customize';
import {
  DayPlan,
  Ingredient,
  IngredientCategory,
  LoggedEntry,
  Meal,
  MealSlot,
  MealType,
  Profile,
  Targets,
} from './types';

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_CLEAN_SCORE: Record<Profile['dietStyle'], number> = {
  strict: 1,
  balanced: 2,
  flexible: 3,
};

export function eligibleMeals(profile: Profile, type?: MealType): Meal[] {
  const fits = (m: Meal, maxScore: number) =>
    (!type || m.type === type) &&
    m.cleanScore <= maxScore &&
    profile.restrictions.every((r) => m.diets.includes(r));

  let result = MEALS.filter((m) => fits(m, MAX_CLEAN_SCORE[profile.dietStyle]));
  // If the diet style filters a slot down to almost nothing, relax it rather than fail.
  if (result.length < 2) result = MEALS.filter((m) => fits(m, 3));
  return result;
}

export interface SlotSpec {
  label: string;
  type: MealType;
}

export function slotTemplate(mealsPerDay: Profile['mealsPerDay']): SlotSpec[] {
  const core: SlotSpec[] = [
    { label: 'Breakfast', type: 'breakfast' },
    { label: 'Lunch', type: 'lunch' },
    { label: 'Dinner', type: 'dinner' },
  ];
  if (mealsPerDay === 3) return core;
  if (mealsPerDay === 4) return [core[0], core[1], { label: 'Snack', type: 'snack' }, core[2]];
  return [
    core[0],
    { label: 'Morning snack', type: 'snack' },
    core[1],
    { label: 'Afternoon snack', type: 'snack' },
    core[2],
  ];
}

export interface PlannerFilters {
  /** total food budget for the whole week, in USD */
  weeklyBudget?: number;
  /** hard cap on a single meal's cook time, in minutes */
  maxMinutes?: number;
  /** only meals that take 15 minutes or less */
  quickOnly?: boolean;
  /** favour higher-protein meals when picking */
  highProtein?: boolean;
  /** only cheap meals (see isBudgetFriendly) */
  budgetFriendlyOnly?: boolean;
  /** only vegetarian-friendly meals */
  vegetarianOnly?: boolean;
  /** avoid repeating the same meal across the week */
  noRepeats?: boolean;
}

function applyPoolFilters(pool: Meal[], filters: PlannerFilters): Meal[] {
  // Each narrowing only sticks if it leaves something to pick — relaxing a
  // filter beats crashing a slot.
  const narrow = (list: Meal[], pred: (m: Meal) => boolean) => {
    const next = list.filter(pred);
    return next.length > 0 ? next : list;
  };

  let filtered = pool;
  const cap = filters.quickOnly ? 15 : filters.maxMinutes;
  if (cap) filtered = narrow(filtered, (m) => m.minutes <= cap);
  if (filters.budgetFriendlyOnly) filtered = narrow(filtered, isBudgetFriendly);
  if (filters.vegetarianOnly) filtered = narrow(filtered, (m) => m.diets.includes('vegetarian'));
  return filtered.length > 0 ? filtered : pool;
}

/**
 * Order candidates so the seeded RNG is more likely to land on preferred meals.
 * When a budget is set we bias toward cheaper meals; highProtein biases up.
 */
function biasPool(pool: Meal[], filters: PlannerFilters): Meal[] {
  if (!filters.weeklyBudget && !filters.highProtein) return pool;
  return [...pool].sort((a, b) => {
    if (filters.weeklyBudget) {
      const d = mealCost(a) - mealCost(b);
      if (Math.abs(d) > 0.01) return d;
    }
    if (filters.highProtein) return b.protein - a.protein;
    return 0;
  });
}

/** Scale every slot uniformly so the day lands near the calorie target. */
function applyDayScale(slots: MealSlot[], targets: Targets): void {
  const total = slots.reduce((sum, s) => sum + (getMeal(s.mealId)?.calories ?? 0), 0);
  if (total > 0) {
    const scale = Math.min(1.6, Math.max(0.7, targets.calories / total));
    const rounded = Math.round(scale * 20) / 20;
    for (const s of slots) s.scale = rounded;
  }
}

/** Per-serving cost of a slot's meal, accounting for any excluded ingredients. */
function slotUnitCost(slot: MealSlot): number {
  const meal = getMeal(slot.mealId);
  if (!meal) return 0;
  const excluded = slot.excludedIngredients ?? [];
  return excluded.length ? customizedMeal(meal, excluded).cost : mealCost(meal);
}

function scaledDayCost(slots: MealSlot[]): number {
  return slots.reduce((sum, s) => sum + slotUnitCost(s) * s.scale, 0);
}

/**
 * Since calories are pinned to the target, the only lever on a day's dollar
 * cost is *which* meals fill the slots. This is a target-seeking optimizer: it
 * aims the day's cost as close to the per-day budget as possible *without going
 * over*, free to swap any slot to any eligible (non-duplicate) meal. That means
 * it will trade cheap meals up for nicer/more varied ones to use the budget
 * that's there, and trade expensive meals down when the day is over. If even
 * the cheapest possible day still exceeds the budget, it minimizes and the UI
 * reports that floor honestly.
 */
function optimizeForBudget(
  slots: MealSlot[],
  profile: Profile,
  targets: Targets,
  filters: PlannerFilters
): void {
  const perDay = (filters.weeklyBudget ?? 0) / 7;
  if (perDay <= 0) {
    applyDayScale(slots, targets);
    return;
  }

  // Small headroom (~2%) so we can sit right under the cap without tipping over.
  const cap = perDay * 0.98;

  // How good is a given day cost? Prefer landing at/just under the cap; anything
  // over the per-day budget is penalized hard so an under-budget option always
  // wins, and among over-budget options the cheapest wins.
  const score = (cost: number) =>
    cost <= cap ? cap - cost : (cost - cap) * 1000 + cap;

  // Cost of the day if slot i were meal `mealId`, after re-scaling to calories.
  const costIfSwap = (i: number, mealId: string): number => {
    const prev = slots[i].mealId;
    slots[i] = { ...slots[i], mealId };
    applyDayScale(slots, targets);
    const c = scaledDayCost(slots);
    slots[i] = { ...slots[i], mealId: prev };
    applyDayScale(slots, targets);
    return c;
  };

  // Greedy: each pass applies the single swap that most improves the score,
  // repeating until nothing helps. Score decreases monotonically, so it settles.
  for (let pass = 0; pass < 24; pass++) {
    applyDayScale(slots, targets);
    let bestScore = score(scaledDayCost(slots));
    let bestSlot = -1;
    let bestMeal = '';

    for (let i = 0; i < slots.length; i++) {
      const current = getMeal(slots[i].mealId);
      if (!current) continue;
      const used = slots.filter((_, j) => j !== i).map((s) => s.mealId);
      for (const alt of filteredAlternatives(profile, current.type, filters, used)) {
        if (alt.id === current.id) continue;
        const s = score(costIfSwap(i, alt.id));
        if (s < bestScore - 0.0001) {
          bestScore = s;
          bestSlot = i;
          bestMeal = alt.id;
        }
      }
    }

    if (bestSlot < 0) break;
    slots[bestSlot] = { ...slots[bestSlot], mealId: bestMeal };
  }
  applyDayScale(slots, targets);
}

export function filteredAlternatives(
  profile: Profile,
  type: MealType,
  filters: PlannerFilters,
  excludeIds: string[]
): Meal[] {
  const excluded = new Set(excludeIds);
  return applyPoolFilters(eligibleMeals(profile, type), filters).filter((m) => !excluded.has(m.id));
}

/** Re-run portion scaling after a manual meal swap. */
export function rescaleDay(plan: DayPlan, targets: Targets): DayPlan {
  const slots = plan.slots.map((s) => ({ ...s }));
  applyDayScale(slots, targets);
  return { ...plan, slots };
}

export function buildDayPlan(
  profile: Profile,
  targets: Targets,
  date: string,
  nonce = 0,
  filters: PlannerFilters = {},
  excludeIds: string[] = []
): DayPlan {
  const rand = mulberry32(hashString(`${date}:${nonce}:${profile.dietStyle}`));
  const budgeted = !!filters.weeklyBudget || !!filters.highProtein;
  const slots: MealSlot[] = [];
  // Seed with cross-day exclusions so no-repeats can span the whole week.
  const used = new Set<string>(excludeIds);

  for (const spec of slotTemplate(profile.mealsPerDay)) {
    const pool = biasPool(applyPoolFilters(eligibleMeals(profile, spec.type), filters), filters);
    const fresh = pool.filter((m) => !used.has(m.id));
    const candidates = fresh.length > 0 ? fresh : pool;
    // With a bias applied, draw from the preferred front of the list rather
    // than uniformly, so cheaper / higher-protein meals win more often.
    const span = budgeted ? Math.max(1, Math.ceil(candidates.length * 0.5)) : candidates.length;
    const pick = candidates[Math.floor(rand() * span)];
    used.add(pick.id);
    slots.push({
      id: `${date}-${slots.length}`,
      label: spec.label,
      mealId: pick.id,
      scale: 1,
      status: 'planned',
    });
  }

  if (filters.weeklyBudget) optimizeForBudget(slots, profile, targets, filters);
  else applyDayScale(slots, targets);

  return { date, slots };
}

export function dayCost(plan: DayPlan): number {
  return plan.slots.reduce((sum, slot) => {
    if (slot.status === 'skipped') return sum;
    return sum + slotUnitCost(slot) * slot.scale;
  }, 0);
}

export interface WeekPlan {
  days: DayPlan[];
  dailyCost: number[];
  totalCost: number;
}

export function buildWeek(
  profile: Profile,
  targets: Targets,
  startDate: string,
  filters: PlannerFilters = {},
  nonce = 0
): WeekPlan {
  const days: DayPlan[] = [];
  const seen: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = buildDayPlan(
      profile,
      targets,
      addDays(startDate, i),
      nonce,
      filters,
      filters.noRepeats ? seen : []
    );
    days.push(day);
    if (filters.noRepeats) seen.push(...day.slots.map((s) => s.mealId));
  }
  const dailyCost = days.map(dayCost);
  return {
    days,
    dailyCost,
    totalCost: dailyCost.reduce((a, b) => a + b, 0),
  };
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function scaledMacros(meal: Meal, scale: number): MacroTotals {
  return {
    calories: Math.round(meal.calories * scale),
    protein: Math.round(meal.protein * scale),
    carbs: Math.round(meal.carbs * scale),
    fat: Math.round(meal.fat * scale),
  };
}

/** Macros for a planned slot, accounting for portion scale and excluded items. */
export function slotMacros(slot: MealSlot): MacroTotals {
  const meal = getMeal(slot.mealId);
  if (!meal) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const excluded = slot.excludedIngredients ?? [];
  const base = excluded.length ? customizedMeal(meal, excluded) : meal;
  return scaledMacros(base as Meal, slot.scale);
}

export function logTotals(entries: LoggedEntry[]): MacroTotals {
  return entries.reduce(
    (t, e) => ({
      calories: t.calories + e.calories,
      protein: t.protein + e.protein,
      carbs: t.carbs + e.carbs,
      fat: t.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function addTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

/** Everything actually consumed on a day: meals marked eaten plus logged food. */
export function consumedTotals(
  plan: DayPlan | undefined,
  entries: LoggedEntry[]
): MacroTotals {
  const eaten = plan ? planTotals(plan, 'eaten') : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return addTotals(eaten, logTotals(entries));
}

export function mealToEntry(meal: Meal, scale = 1): LoggedEntry {
  const m = scaledMacros(meal, scale);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: scale === 1 ? meal.name : `${meal.name} (${scale}x)`,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    source: 'meal',
    mealId: meal.id,
    time: new Date().toISOString(),
  };
}

export function planTotals(plan: DayPlan, mode: 'planned' | 'eaten'): MacroTotals {
  const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const slot of plan.slots) {
    if (mode === 'eaten' ? slot.status !== 'eaten' : slot.status === 'skipped') continue;
    const m = slotMacros(slot);
    totals.calories += m.calories;
    totals.protein += m.protein;
    totals.carbs += m.carbs;
    totals.fat += m.fat;
  }
  return totals;
}

export function alternativesFor(profile: Profile, type: MealType, excludeIds: string[]): Meal[] {
  const excluded = new Set(excludeIds);
  return eligibleMeals(profile, type).filter((m) => !excluded.has(m.id));
}

export interface GroceryItem {
  /** unique within the whole list — safe to use as a React key */
  key: string;
  item: string;
  qty: number;
  unit: string;
  /** names of the meals this item is being bought for */
  sources: string[];
}

export interface GrocerySection {
  category: IngredientCategory;
  items: GroceryItem[];
}

/** A grocery item the user added by hand, not derived from the meal plan. */
export interface GroceryCustomItem {
  /** unique key, always prefixed "custom|" so it never collides with a derived key */
  key: string;
  item: string;
  qty: number;
  unit: string;
  category: IngredientCategory;
}

export const CATEGORY_ORDER: IngredientCategory[] = [
  'produce',
  'protein',
  'dairy',
  'grains',
  'bakery',
  'frozen',
  'pantry',
];

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  produce: 'Produce',
  protein: 'Meat & fish',
  dairy: 'Dairy & eggs',
  grains: 'Grains',
  bakery: 'Bakery',
  frozen: 'Frozen',
  pantry: 'Pantry',
};

function roundQty(qty: number): number {
  if (qty >= 100) return Math.ceil(qty / 10) * 10;
  if (qty >= 10) return Math.ceil(qty);
  return Math.ceil(qty * 4) / 4;
}

export function groceryList(plans: DayPlan[]): GrocerySection[] {
  // Aggregate by item + unit so, e.g., "Honey (tbsp)" and "Honey (tsp)" stay
  // distinct rows with unique keys, while repeats of the same unit combine.
  const byKey = new Map<
    string,
    { ingredient: Ingredient; qty: number; sources: Set<string> }
  >();
  for (const plan of plans) {
    for (const slot of plan.slots) {
      if (slot.status === 'skipped') continue;
      const meal = getMeal(slot.mealId);
      if (!meal) continue;
      const excluded = new Set(slot.excludedIngredients ?? []);
      for (const ing of meal.ingredients) {
        if (excluded.has(ing.item)) continue;
        const key = `${ing.category}|${ing.item.toLowerCase()}|${ing.unit}`;
        const existing = byKey.get(key);
        if (existing) {
          existing.qty += ing.qty * slot.scale;
          existing.sources.add(meal.name);
        } else {
          byKey.set(key, {
            ingredient: ing,
            qty: ing.qty * slot.scale,
            sources: new Set([meal.name]),
          });
        }
      }
    }
  }

  const sections = new Map<IngredientCategory, GroceryItem[]>();
  for (const [key, { ingredient, qty, sources }] of byKey.entries()) {
    const list = sections.get(ingredient.category) ?? [];
    list.push({
      key,
      item: ingredient.item,
      qty: roundQty(qty),
      unit: ingredient.unit,
      sources: [...sources].sort((a, b) => a.localeCompare(b)),
    });
    sections.set(ingredient.category, list);
  }

  return CATEGORY_ORDER.filter((c) => sections.has(c)).map((category) => ({
    category,
    items: sections.get(category)!.sort((a, b) => a.item.localeCompare(b.item)),
  }));
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return todayKey(dt);
}
