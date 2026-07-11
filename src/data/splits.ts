export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

export interface SplitDay {
  id: string;
  name: string;
  focus: string;
  exercises: Exercise[];
}

export interface Split {
  id: string;
  name: string;
  daysPerWeek: string;
  description: string;
  days: SplitDay[];
}

const ex = (id: string, name: string, sets: number, reps: string): Exercise => ({ id, name, sets, reps });

export const SPLITS: Split[] = [
  {
    id: 'full-body',
    name: 'Full Body',
    daysPerWeek: '2-3 days',
    description: 'Every muscle, every session. The most efficient option when time is tight.',
    days: [
      {
        id: 'fb-a',
        name: 'Full Body A',
        focus: 'Squat focus',
        exercises: [
          ex('squat', 'Barbell squat', 3, '5-8'),
          ex('bench', 'Bench press', 3, '6-10'),
          ex('row', 'Barbell row', 3, '8-10'),
          ex('rdl', 'Romanian deadlift', 3, '8-12'),
          ex('curl', 'Dumbbell curl', 2, '10-15'),
          ex('plank', 'Plank', 3, '45s'),
        ],
      },
      {
        id: 'fb-b',
        name: 'Full Body B',
        focus: 'Hinge focus',
        exercises: [
          ex('deadlift', 'Deadlift', 3, '4-6'),
          ex('ohp', 'Overhead press', 3, '6-10'),
          ex('pulldown', 'Lat pulldown', 3, '10-12'),
          ex('lunge', 'Walking lunges', 3, '10/leg'),
          ex('tricep', 'Tricep pushdown', 2, '12-15'),
          ex('crunch', 'Cable crunch', 3, '12-15'),
        ],
      },
      {
        id: 'fb-c',
        name: 'Full Body C',
        focus: 'Press focus',
        exercises: [
          ex('front-squat', 'Front squat or leg press', 3, '8-10'),
          ex('incline-db', 'Incline dumbbell press', 3, '8-12'),
          ex('pullup', 'Pull-ups or assisted', 3, 'AMRAP'),
          ex('hip-thrust', 'Hip thrust', 3, '10-12'),
          ex('lateral', 'Lateral raise', 3, '12-15'),
          ex('leg-raise', 'Hanging leg raise', 3, '10-15'),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    daysPerWeek: '4 days',
    description: 'Two upper and two lower sessions a week. Great balance of volume and recovery.',
    days: [
      {
        id: 'ul-u1',
        name: 'Upper 1',
        focus: 'Strength bias',
        exercises: [
          ex('bench', 'Bench press', 4, '5-8'),
          ex('row', 'Barbell row', 4, '6-10'),
          ex('ohp', 'Overhead press', 3, '8-10'),
          ex('pulldown', 'Lat pulldown', 3, '10-12'),
          ex('curl', 'Dumbbell curl', 3, '10-12'),
          ex('tricep', 'Tricep pushdown', 3, '10-12'),
        ],
      },
      {
        id: 'ul-l1',
        name: 'Lower 1',
        focus: 'Squat bias',
        exercises: [
          ex('squat', 'Barbell squat', 4, '5-8'),
          ex('rdl', 'Romanian deadlift', 3, '8-10'),
          ex('leg-press', 'Leg press', 3, '10-12'),
          ex('leg-curl', 'Leg curl', 3, '10-15'),
          ex('calf', 'Standing calf raise', 4, '10-15'),
          ex('plank', 'Plank', 3, '45s'),
        ],
      },
      {
        id: 'ul-u2',
        name: 'Upper 2',
        focus: 'Hypertrophy bias',
        exercises: [
          ex('incline-db', 'Incline dumbbell press', 4, '8-12'),
          ex('pullup', 'Pull-ups or assisted', 3, 'AMRAP'),
          ex('cable-row', 'Seated cable row', 3, '10-12'),
          ex('lateral', 'Lateral raise', 4, '12-15'),
          ex('hammer', 'Hammer curl', 3, '10-12'),
          ex('overhead-ext', 'Overhead tricep extension', 3, '10-12'),
        ],
      },
      {
        id: 'ul-l2',
        name: 'Lower 2',
        focus: 'Hinge bias',
        exercises: [
          ex('deadlift', 'Deadlift', 3, '4-6'),
          ex('front-squat', 'Front squat or hack squat', 3, '8-10'),
          ex('lunge', 'Walking lunges', 3, '10/leg'),
          ex('leg-ext', 'Leg extension', 3, '12-15'),
          ex('calf-seated', 'Seated calf raise', 4, '12-15'),
          ex('leg-raise', 'Hanging leg raise', 3, '10-15'),
        ],
      },
    ],
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    daysPerWeek: '3-6 days',
    description: 'The classic. Run it once through for 3 days or twice for 6.',
    days: [
      {
        id: 'ppl-push',
        name: 'Push',
        focus: 'Chest, shoulders, triceps',
        exercises: [
          ex('bench', 'Bench press', 4, '6-10'),
          ex('ohp', 'Overhead press', 3, '8-10'),
          ex('incline-db', 'Incline dumbbell press', 3, '8-12'),
          ex('lateral', 'Lateral raise', 4, '12-15'),
          ex('tricep', 'Tricep pushdown', 3, '10-12'),
          ex('overhead-ext', 'Overhead tricep extension', 3, '10-12'),
        ],
      },
      {
        id: 'ppl-pull',
        name: 'Pull',
        focus: 'Back, biceps, rear delts',
        exercises: [
          ex('deadlift', 'Deadlift', 3, '4-6'),
          ex('pullup', 'Pull-ups or pulldown', 4, '8-12'),
          ex('cable-row', 'Seated cable row', 3, '10-12'),
          ex('face-pull', 'Face pull', 3, '12-15'),
          ex('curl', 'Dumbbell curl', 3, '10-12'),
          ex('hammer', 'Hammer curl', 3, '10-12'),
        ],
      },
      {
        id: 'ppl-legs',
        name: 'Legs',
        focus: 'Quads, hamstrings, calves',
        exercises: [
          ex('squat', 'Barbell squat', 4, '6-10'),
          ex('rdl', 'Romanian deadlift', 3, '8-10'),
          ex('leg-press', 'Leg press', 3, '10-12'),
          ex('leg-curl', 'Leg curl', 3, '10-15'),
          ex('calf', 'Standing calf raise', 4, '10-15'),
          ex('leg-raise', 'Hanging leg raise', 3, '10-15'),
        ],
      },
    ],
  },
  {
    id: 'home',
    name: 'Home / Bodyweight',
    daysPerWeek: '3-5 days',
    description: 'No gym required. Dumbbells optional, progress by adding reps.',
    days: [
      {
        id: 'home-a',
        name: 'Push + Core',
        focus: 'Chest, shoulders, abs',
        exercises: [
          ex('pushup', 'Push-ups', 4, 'AMRAP'),
          ex('pike', 'Pike push-ups', 3, '8-12'),
          ex('dips', 'Chair dips', 3, '10-15'),
          ex('plank', 'Plank', 3, '45s'),
          ex('crunch-home', 'Bicycle crunches', 3, '20'),
        ],
      },
      {
        id: 'home-b',
        name: 'Legs + Glutes',
        focus: 'Lower body',
        exercises: [
          ex('squat-bw', 'Bodyweight or goblet squats', 4, '15-20'),
          ex('lunge', 'Walking lunges', 3, '12/leg'),
          ex('glute-bridge', 'Glute bridge', 3, '15-20'),
          ex('calf', 'Single-leg calf raise', 3, '15/leg'),
          ex('wall-sit', 'Wall sit', 3, '45s'),
        ],
      },
      {
        id: 'home-c',
        name: 'Pull + Arms',
        focus: 'Back, biceps',
        exercises: [
          ex('row-db', 'Dumbbell or backpack rows', 4, '10-12'),
          ex('superman', 'Supermans', 3, '15'),
          ex('curl', 'Dumbbell curl', 3, '10-15'),
          ex('rear-fly', 'Bent-over reverse fly', 3, '12-15'),
          ex('leg-raise', 'Lying leg raise', 3, '12-15'),
        ],
      },
    ],
  },
];

export function getSplit(id: string, extra: Split[] = []): Split {
  return [...extra, ...SPLITS].find((s) => s.id === id) ?? SPLITS[0];
}

export function allSplits(extra: Split[] = []): Split[] {
  return [...SPLITS, ...extra];
}
