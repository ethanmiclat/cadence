import { costOfIngredients } from './cost';
import { Ingredient, IngredientCategory, Meal } from './types';

interface Macro {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Rough macro density per gram, by category. Used only to estimate each
// ingredient's *relative* contribution to a meal; the result is re-calibrated
// against the meal's authored macros, so absolute accuracy isn't required.
const PER_GRAM: Record<IngredientCategory, Macro> = {
  produce: { calories: 0.35, protein: 0.015, carbs: 0.07, fat: 0.003 },
  protein: { calories: 2.0, protein: 0.25, carbs: 0.0, fat: 0.11 },
  dairy: { calories: 1.4, protein: 0.11, carbs: 0.05, fat: 0.09 },
  grains: { calories: 3.6, protein: 0.12, carbs: 0.72, fat: 0.03 },
  pantry: { calories: 3.0, protein: 0.08, carbs: 0.3, fat: 0.15 },
  frozen: { calories: 0.7, protein: 0.04, carbs: 0.1, fat: 0.01 },
  bakery: { calories: 2.7, protein: 0.09, carbs: 0.5, fat: 0.03 },
};

// Approximate weight of one "piece" of a countable unit, so everything can be
// reasoned about in grams.
const PIECE_GRAMS: Record<string, number> = {
  '': 100,
  slice: 30,
  scoop: 30,
  can: 240,
  clove: 5,
  leaves: 2,
  tbsp: 15,
  tsp: 5,
  pinch: 1,
};

function grams(ing: Ingredient): number {
  const piece = PIECE_GRAMS[ing.unit.trim()];
  return piece !== undefined ? ing.qty * piece : ing.qty;
}

function estimate(ing: Ingredient): Macro {
  const g = grams(ing);
  const r = PER_GRAM[ing.category];
  return { calories: g * r.calories, protein: g * r.protein, carbs: g * r.carbs, fat: g * r.fat };
}

const ZERO: Macro = { calories: 0, protein: 0, carbs: 0, fat: 0 };
function add(a: Macro, b: Macro): Macro {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

export function remainingIngredients(meal: Meal, excluded: string[]): Ingredient[] {
  const ex = new Set(excluded);
  return meal.ingredients.filter((i) => !ex.has(i.item));
}

export interface CustomizedMeal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
}

/**
 * Macros and cost of a meal with some ingredients left out. Cost is recomputed
 * exactly from the remaining ingredients; macros keep the authored totals and
 * subtract each excluded ingredient's estimated share (so "hold the oil" cuts
 * fat more than carbs).
 */
export function customizedMeal(meal: Meal, excluded: string[]): CustomizedMeal {
  const remain = remainingIngredients(meal, excluded);
  const cost = costOfIngredients(remain);
  if (excluded.length === 0) {
    return { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, cost };
  }

  const total = meal.ingredients.map(estimate).reduce(add, ZERO);
  const kept = remain.map(estimate).reduce(add, ZERO);
  const frac = (k: number, t: number) => (t > 0 ? Math.min(1, k / t) : 1);

  return {
    calories: Math.round(meal.calories * frac(kept.calories, total.calories)),
    protein: Math.round(meal.protein * frac(kept.protein, total.protein)),
    carbs: Math.round(meal.carbs * frac(kept.carbs, total.carbs)),
    fat: Math.round(meal.fat * frac(kept.fat, total.fat)),
    cost,
  };
}
