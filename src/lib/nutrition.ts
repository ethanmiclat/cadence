import { Activity, Profile, Sex, Targets } from './types';

const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, { title: string; detail: string }> = {
  sedentary: { title: 'Sedentary', detail: 'Desk job, little exercise' },
  light: { title: 'Lightly active', detail: '1 to 2 workouts a week' },
  moderate: { title: 'Moderately active', detail: '3 to 4 workouts a week' },
  active: { title: 'Very active', detail: '5 to 6 workouts a week' },
  athlete: { title: 'Athlete', detail: 'Hard training most days' },
};

/** Mifflin-St Jeor resting metabolic rate */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

const KCAL_PER_KG = 7700;

export function computeTargets(p: Profile): Targets {
  const rest = bmr(p.sex, p.weightKg, p.heightCm, p.age);
  const tdee = rest * ACTIVITY_FACTORS[p.activity];

  const losing = p.goalWeightKg < p.weightKg;
  const gaining = p.goalWeightKg > p.weightKg;
  const pace = Math.abs(p.paceKgPerWeek);
  const rawDelta = losing ? -(pace * KCAL_PER_KG) / 7 : gaining ? (pace * KCAL_PER_KG) / 7 : 0;

  let calories = tdee + rawDelta;
  // Safety floor: never plan below the resting rate or common clinical minimums.
  const floor = Math.max(p.sex === 'male' ? 1500 : 1200, rest * 0.85);
  let floored = false;
  if (calories < floor) {
    calories = floor;
    floored = true;
  }
  calories = Math.round(calories / 5) * 5;
  const dailyDelta = calories - tdee;

  // Protein anchored to bodyweight (higher on a cut to protect lean mass),
  // fat at ~27% of calories, carbs fill the remainder.
  const proteinPerKg = losing ? 2.0 : gaining ? 1.8 : 1.6;
  const protein = Math.round(proteinPerKg * p.weightKg);
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  const weeklyKg = Math.abs(dailyDelta * 7) / KCAL_PER_KG;
  const distance = Math.abs(p.weightKg - p.goalWeightKg);
  const etaWeeks = weeklyKg > 0.01 ? distance / weeklyKg : 0;

  return { calories, protein, carbs, fat, tdee: Math.round(tdee), dailyDelta: Math.round(dailyDelta), etaWeeks, floored };
}

export const KG_PER_LB = 0.453592;
export const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}
export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function formatWeight(kg: number, units: 'imperial' | 'metric', digits = 0): string {
  return units === 'imperial' ? `${kgToLb(kg).toFixed(digits)} lb` : `${kg.toFixed(digits)} kg`;
}

export function formatHeight(cm: number, units: 'imperial' | 'metric'): string {
  if (units === 'metric') return `${Math.round(cm)} cm`;
  const totalIn = cm / CM_PER_IN;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn % 12);
  return `${ft}'${inch}"`;
}
