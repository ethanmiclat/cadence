import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Split } from '../data/splits';
import { computeTargets } from '../lib/nutrition';
import { buildDayPlan, GroceryCustomItem } from '../lib/planner';
import { DayPlan, LoggedEntry, Profile, SlotStatus, WeighIn, WorkoutLog } from '../lib/types';
import { ThemeName } from '../theme/tokens';

export type ThemePreference = ThemeName | 'system';

export const DEFAULT_PROFILE: Profile = {
  name: '',
  sex: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  goalWeightKg: 74,
  paceKgPerWeek: 0.5,
  activity: 'moderate',
  dietStyle: 'balanced',
  restrictions: [],
  mealsPerDay: 3,
  trainingDaysPerWeek: 3,
  splitId: 'full-body',
  units: 'imperial',
};

interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  themePreference: ThemePreference;
  profile: Profile;
  plans: Record<string, DayPlan>;
  planNonces: Record<string, number>;
  logs: Record<string, LoggedEntry[]>;
  customSplits: Split[];
  workouts: WorkoutLog[];
  weighIns: WeighIn[];
  /** grocery checkmarks keyed by GroceryItem.key, persisted across sessions */
  groceryChecked: Record<string, boolean>;
  /** items the user added by hand */
  groceryCustom: GroceryCustomItem[];
  /** keys of plan-derived items the user removed from the list */
  groceryRemoved: string[];
  /** date -> number of items checked off, recorded when a shopping trip is marked done */
  shoppingLog: Record<string, number>;

  setHydrated: () => void;
  setThemePreference: (pref: ThemePreference) => void;
  completeOnboarding: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  ensurePlan: (date: string) => DayPlan;
  regeneratePlan: (date: string) => void;
  setDayPlan: (plan: DayPlan) => void;
  setSlotStatus: (date: string, slotId: string, status: SlotStatus) => void;
  setSlotScale: (date: string, slotId: string, scale: number) => void;
  swapSlotMeal: (date: string, slotId: string, mealId: string) => void;
  toggleSlotIngredient: (date: string, slotId: string, item: string) => void;
  addLog: (date: string, entry: LoggedEntry) => void;
  removeLog: (date: string, entryId: string) => void;
  addCustomSplit: (split: Split) => void;
  updateCustomSplit: (split: Split) => void;
  deleteCustomSplit: (id: string) => void;
  saveWorkout: (log: WorkoutLog) => void;
  addWeighIn: (weighIn: WeighIn) => void;
  toggleGroceryChecked: (key: string) => void;
  addGroceryItem: (item: Omit<GroceryCustomItem, 'key'>) => void;
  removeGroceryItem: (key: string) => void;
  resetGroceries: () => void;
  markShoppingDone: (date: string, count: number) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      themePreference: 'system',
      profile: DEFAULT_PROFILE,
      plans: {},
      planNonces: {},
      logs: {},
      customSplits: [],
      workouts: [],
      weighIns: [],
      groceryChecked: {},
      groceryCustom: [],
      groceryRemoved: [],
      shoppingLog: {},

      setHydrated: () => set({ hydrated: true }),
      setThemePreference: (themePreference) => set({ themePreference }),

      completeOnboarding: (profile) =>
        set({
          profile,
          onboarded: true,
          plans: {},
          planNonces: {},
          logs: {},
          groceryChecked: {},
          groceryCustom: [],
          groceryRemoved: [],
          shoppingLog: {},
        }),

      updateProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),

      ensurePlan: (date) => {
        const existing = get().plans[date];
        if (existing) return existing;
        const { profile, planNonces } = get();
        const plan = buildDayPlan(profile, computeTargets(profile), date, planNonces[date] ?? 0);
        set({ plans: { ...get().plans, [date]: plan } });
        return plan;
      },

      regeneratePlan: (date) => {
        const { profile, planNonces, plans } = get();
        const nonce = (planNonces[date] ?? 0) + 1;
        const plan = buildDayPlan(profile, computeTargets(profile), date, nonce);
        set({
          planNonces: { ...planNonces, [date]: nonce },
          plans: { ...plans, [date]: plan },
        });
      },

      setDayPlan: (plan) => set({ plans: { ...get().plans, [plan.date]: plan } }),

      setSlotStatus: (date, slotId, status) => {
        const plan = get().plans[date];
        if (!plan) return;
        const slots = plan.slots.map((s) => (s.id === slotId ? { ...s, status } : s));
        set({ plans: { ...get().plans, [date]: { ...plan, slots } } });
      },

      setSlotScale: (date, slotId, scale) => {
        const plan = get().plans[date];
        if (!plan) return;
        const slots = plan.slots.map((s) => (s.id === slotId ? { ...s, scale } : s));
        set({ plans: { ...get().plans, [date]: { ...plan, slots } } });
      },

      swapSlotMeal: (date, slotId, mealId) => {
        const plan = get().plans[date];
        if (!plan) return;
        const slots = plan.slots.map((s) =>
          s.id === slotId
            ? { ...s, mealId, status: 'planned' as SlotStatus, excludedIngredients: [] }
            : s
        );
        set({ plans: { ...get().plans, [date]: { ...plan, slots } } });
      },

      toggleSlotIngredient: (date, slotId, item) => {
        const plan = get().plans[date];
        if (!plan) return;
        const slots = plan.slots.map((s) => {
          if (s.id !== slotId) return s;
          const current = s.excludedIngredients ?? [];
          const excludedIngredients = current.includes(item)
            ? current.filter((x) => x !== item)
            : [...current, item];
          return { ...s, excludedIngredients };
        });
        set({ plans: { ...get().plans, [date]: { ...plan, slots } } });
      },

      addLog: (date, entry) => {
        const existing = get().logs[date] ?? [];
        set({ logs: { ...get().logs, [date]: [...existing, entry] } });
      },

      removeLog: (date, entryId) => {
        const existing = get().logs[date] ?? [];
        set({
          logs: { ...get().logs, [date]: existing.filter((e) => e.id !== entryId) },
        });
      },

      addCustomSplit: (split) => set({ customSplits: [...get().customSplits, split] }),

      updateCustomSplit: (split) =>
        set({
          customSplits: get().customSplits.map((s) => (s.id === split.id ? split : s)),
        }),

      deleteCustomSplit: (id) => {
        const customSplits = get().customSplits.filter((s) => s.id !== id);
        const profile = get().profile;
        // If the active split was deleted, fall back to a built-in one.
        const nextProfile =
          profile.splitId === id ? { ...profile, splitId: 'full-body' } : profile;
        set({ customSplits, profile: nextProfile });
      },

      saveWorkout: (log) => {
        const rest = get().workouts.filter(
          (w) => !(w.date === log.date && w.splitDayId === log.splitDayId)
        );
        set({ workouts: [...rest, log] });
      },

      addWeighIn: (weighIn) => {
        const rest = get().weighIns.filter((w) => w.date !== weighIn.date);
        const weighIns = [...rest, weighIn].sort((a, b) => a.date.localeCompare(b.date));
        set({ weighIns, profile: { ...get().profile, weightKg: weighIn.weightKg } });
      },

      toggleGroceryChecked: (key) =>
        set({ groceryChecked: { ...get().groceryChecked, [key]: !get().groceryChecked[key] } }),

      addGroceryItem: (item) => {
        const key = `custom|${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set({ groceryCustom: [...get().groceryCustom, { ...item, key }] });
      },

      removeGroceryItem: (key) => {
        const { groceryCustom, groceryRemoved, groceryChecked } = get();
        const checked = { ...groceryChecked };
        delete checked[key];
        if (key.startsWith('custom|')) {
          set({ groceryCustom: groceryCustom.filter((i) => i.key !== key), groceryChecked: checked });
        } else {
          set({
            groceryRemoved: groceryRemoved.includes(key) ? groceryRemoved : [...groceryRemoved, key],
            groceryChecked: checked,
          });
        }
      },

      resetGroceries: () => set({ groceryChecked: {}, groceryCustom: [], groceryRemoved: [] }),

      markShoppingDone: (date, count) =>
        set({ shoppingLog: { ...get().shoppingLog, [date]: count } }),

      resetAll: () =>
        set({
          onboarded: false,
          profile: DEFAULT_PROFILE,
          plans: {},
          planNonces: {},
          logs: {},
          customSplits: [],
          workouts: [],
          weighIns: [],
          groceryChecked: {},
          groceryCustom: [],
          groceryRemoved: [],
          shoppingLog: {},
        }),
    }),
    {
      name: 'cadence-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

export function useTargets() {
  const profile = useAppStore((s) => s.profile);
  return computeTargets(profile);
}
