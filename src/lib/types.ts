export type Sex = 'male' | 'female';
export type Units = 'imperial' | 'metric';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type DietStyle = 'flexible' | 'balanced' | 'strict';
export type Restriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'pescatarian';

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  /** kg per week; positive means losing, negative means gaining */
  paceKgPerWeek: number;
  activity: Activity;
  dietStyle: DietStyle;
  restrictions: Restriction[];
  mealsPerDay: 3 | 4 | 5;
  trainingDaysPerWeek: number;
  splitId: string;
  units: Units;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tdee: number;
  /** negative for a deficit, positive for a surplus */
  dailyDelta: number;
  etaWeeks: number;
  floored: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type IngredientCategory =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'grains'
  | 'pantry'
  | 'frozen'
  | 'bakery';

export interface Ingredient {
  item: string;
  qty: number;
  unit: string;
  category: IngredientCategory;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  /** 1 = whole food, 2 = balanced, 3 = indulgent */
  cleanScore: 1 | 2 | 3;
  diets: Restriction[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minutes: number;
  ingredients: Ingredient[];
  steps: string[];
  /** Optional link to a full recipe; a web search is used when absent. */
  recipeUrl?: string;
}

/** A single item eaten and recorded, whether a library meal or a free-form entry. */
export interface LoggedEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'meal' | 'custom';
  mealId?: string;
  /** ISO timestamp of when it was logged */
  time: string;
}

export type SlotStatus = 'planned' | 'eaten' | 'skipped';

export interface MealSlot {
  id: string;
  label: string;
  mealId: string;
  /** portion multiplier applied to the base recipe */
  scale: number;
  status: SlotStatus;
  /** ingredient item names the user has left out of this meal */
  excludedIngredients?: string[];
}

export interface DayPlan {
  date: string; // yyyy-mm-dd
  slots: MealSlot[];
}

export interface SetLog {
  reps: number;
  weightKg: number;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  date: string;
  splitDayId: string;
  exercises: ExerciseLog[];
  completed: boolean;
}

export interface WeighIn {
  date: string;
  weightKg: number;
}
