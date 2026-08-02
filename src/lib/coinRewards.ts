/** Single source of truth for Study Coin amounts shown in UI and granted in App. */
export const COIN_REWARDS = {
  MOCK_COMPLETE: 20,
  DAILY_STUDY_PLAN: 10,
} as const;

export const REDEEMABLE_CATALOG = [
  {
    id: 'red-01',
    title: 'Chemical Kinetics High-Yield Practice Pack (30 Qs)',
    category: 'Revision Pack',
    coinCost: 50,
    description:
      'Unlock 30 extra questions with step-by-step solutions for Chemical Kinetics & related high-yield topics.',
  },
  {
    id: 'red-02',
    title: '1 Extra CEE Full Mock Quota',
    category: 'Mock Quota',
    coinCost: 100,
    description: 'Grants +1 full timed CEE mock attempt added to your remaining quota.',
  },
  {
    id: 'red-03',
    title: 'PYP 2081 Master Exam Solution Pack',
    category: 'Past Papers',
    coinCost: 75,
    description: 'Chapter breakdown and formula shortcuts for CEE past-paper style review.',
  },
] as const;

export const EARNING_RULES = [
  {
    title: 'Complete Mock Test',
    desc: 'Scored attempt finalized',
    coins: COIN_REWARDS.MOCK_COMPLETE,
  },
  {
    title: 'Complete Daily Study Plan',
    desc: 'All planner tasks checked off for the day',
    coins: COIN_REWARDS.DAILY_STUDY_PLAN,
  },
] as const;
