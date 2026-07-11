import { Ingredient, IngredientCategory, Meal } from './types';

// A lightweight grocery-cost model. Prices are rough US-supermarket averages
// meant for relative budgeting, not accounting. Two rate tables: one per gram
// (for weight/volume units) and one per piece (for countable units).
const RATE_PER_GRAM: Record<IngredientCategory, number> = {
  produce: 0.005,
  protein: 0.02,
  dairy: 0.007,
  grains: 0.003,
  pantry: 0.006,
  frozen: 0.008,
  bakery: 0.01,
};

const RATE_PER_PIECE: Record<IngredientCategory, number> = {
  produce: 0.5,
  protein: 2.2,
  dairy: 0.35,
  grains: 0.4,
  pantry: 0.3,
  frozen: 1.4,
  bakery: 0.5,
};

// Countable units are charged per piece; a spoon of a pantry item is a small
// fraction of a "piece". Everything else falls back to the per-gram rate.
const PIECE_UNITS: Record<string, number> = {
  '': 1,
  slice: 1,
  scoop: 1,
  can: 1,
  clove: 0.4,
  leaves: 0.2,
  tbsp: 0.5,
  tsp: 0.25,
};

// Bulk liquids that the category rates would wildly overprice (a category rate
// treats 500ml of broth like 500g of solid pantry goods). Priced per ml here.
function liquidOverride(name: string, qty: number): number | null {
  if (name.includes('coconut milk')) return qty * 0.004;
  if (name.includes('water')) return 0;
  if (name.includes('broth') || name.includes('stock')) return qty * 0.0015;
  if (name.startsWith('milk') || name.includes('milk (')) return qty * 0.0012;
  return null;
}

export function ingredientCost(ing: Ingredient): number {
  const override = liquidOverride(ing.item.toLowerCase(), ing.qty);
  if (override !== null) return override;

  const pieceWeight = PIECE_UNITS[ing.unit.trim()];
  if (pieceWeight !== undefined) {
    return ing.qty * pieceWeight * RATE_PER_PIECE[ing.category];
  }
  // 'g', 'g dry', 'ml' and anything weight-like.
  return ing.qty * RATE_PER_GRAM[ing.category];
}

/** Estimated grocery cost of one serving of a meal, in USD. */
export function mealCost(meal: Meal): number {
  return costOfIngredients(meal.ingredients);
}

/** Cost of an arbitrary ingredient list (used when some are excluded). */
export function costOfIngredients(ingredients: Ingredient[]): number {
  const raw = ingredients.reduce((sum, ing) => sum + ingredientCost(ing), 0);
  return Math.max(0.5, Math.round(raw * 100) / 100);
}

/** Under this per-serving cost a meal counts as budget-friendly. */
export const BUDGET_THRESHOLD = 2.75;

export function isBudgetFriendly(meal: Meal): boolean {
  return mealCost(meal) <= BUDGET_THRESHOLD;
}

export function formatMoney(usd: number): string {
  return `$${usd.toFixed(2)}`;
}
