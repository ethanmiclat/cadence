import { Meal } from './types';

/**
 * A link to the full recipe. When a meal has no explicit recipeUrl we fall back
 * to a web search for the dish, which always resolves to something useful.
 */
export function recipeLink(meal: Meal): string {
  if (meal.recipeUrl) return meal.recipeUrl;
  return `https://www.google.com/search?q=${encodeURIComponent(`${meal.name} recipe`)}`;
}
