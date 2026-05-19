// Collectible reward catalog. Mirrors the badges.ts pattern: scenes live in
// TypeScript (small, static, easy to edit) and only the per-user unlock state
// is persisted in the user_reward table.
//
// orderIndex is narrative order for the board, not unlock order. The user
// fills the board out of sequence depending on whether they rack up sessions,
// masteries, milestones, or a streak first — that's intentional, the gaps
// become "what's next" anticipation.

export type UnlockRule =
  | { kind: 'session_count'; threshold: number }
  | { kind: 'mastered_count'; threshold: number }
  | { kind: 'milestone_count'; threshold: number }
  | { kind: 'streak'; threshold: number };

export type SeedRewardJourney = {
  id: string;
  title: string;
  orderIndex: number;
};

export type SeedRewardScene = {
  id: string;
  journeyId: string;
  orderIndex: number;
  title: string;
  artworkPath: string;
  unlock: UnlockRule;
};

export const SEED_REWARD_JOURNEYS: SeedRewardJourney[] = [
  { id: 'swan-lake', title: 'Swan Lake', orderIndex: 1 },
];

export const SEED_REWARD_SCENES: SeedRewardScene[] = [
  { id: 'swan-lake-01', journeyId: 'swan-lake', orderIndex: 1,
    title: 'The curtain rises', artworkPath: '/rewards/swan-lake/01.svg',
    unlock: { kind: 'session_count', threshold: 1 } },
  { id: 'swan-lake-02', journeyId: 'swan-lake', orderIndex: 2,
    title: 'Prince Siegfried enters the courtyard', artworkPath: '/rewards/swan-lake/02.svg',
    unlock: { kind: 'session_count', threshold: 2 } },
  { id: 'swan-lake-03', journeyId: 'swan-lake', orderIndex: 3,
    title: 'A birthday celebration', artworkPath: '/rewards/swan-lake/03.svg',
    unlock: { kind: 'session_count', threshold: 3 } },
  { id: 'swan-lake-04', journeyId: 'swan-lake', orderIndex: 4,
    title: 'A bow to the Queen', artworkPath: '/rewards/swan-lake/04.svg',
    unlock: { kind: 'mastered_count', threshold: 1 } },
  { id: 'swan-lake-05', journeyId: 'swan-lake', orderIndex: 5,
    title: 'Off to the lake by moonlight', artworkPath: '/rewards/swan-lake/05.svg',
    unlock: { kind: 'session_count', threshold: 5 } },
  { id: 'swan-lake-06', journeyId: 'swan-lake', orderIndex: 6,
    title: 'Footprints in the moonlight', artworkPath: '/rewards/swan-lake/06.svg',
    unlock: { kind: 'milestone_count', threshold: 1 } },
  { id: 'swan-lake-07', journeyId: 'swan-lake', orderIndex: 7,
    title: 'A flock of swans appears', artworkPath: '/rewards/swan-lake/07.svg',
    unlock: { kind: 'session_count', threshold: 7 } },
  { id: 'swan-lake-08', journeyId: 'swan-lake', orderIndex: 8,
    title: 'Odette emerges from the lake', artworkPath: '/rewards/swan-lake/08.svg',
    unlock: { kind: 'mastered_count', threshold: 2 } },
  { id: 'swan-lake-09', journeyId: 'swan-lake', orderIndex: 9,
    title: 'She tells her story', artworkPath: '/rewards/swan-lake/09.svg',
    unlock: { kind: 'session_count', threshold: 10 } },
  { id: 'swan-lake-10', journeyId: 'swan-lake', orderIndex: 10,
    title: 'A vow under the stars', artworkPath: '/rewards/swan-lake/10.svg',
    unlock: { kind: 'streak', threshold: 7 } },
  { id: 'swan-lake-11', journeyId: 'swan-lake', orderIndex: 11,
    title: 'Siegfried lifts Odette', artworkPath: '/rewards/swan-lake/11.svg',
    unlock: { kind: 'mastered_count', threshold: 3 } },
  { id: 'swan-lake-12', journeyId: 'swan-lake', orderIndex: 12,
    title: 'The Pas de Quatre begins', artworkPath: '/rewards/swan-lake/12.svg',
    unlock: { kind: 'session_count', threshold: 15 } },
  { id: 'swan-lake-13', journeyId: 'swan-lake', orderIndex: 13,
    title: 'Cygnets in a row', artworkPath: '/rewards/swan-lake/13.svg',
    unlock: { kind: 'mastered_count', threshold: 4 } },
  { id: 'swan-lake-14', journeyId: 'swan-lake', orderIndex: 14,
    title: 'Dawn returns — Odette must go', artworkPath: '/rewards/swan-lake/14.svg',
    unlock: { kind: 'session_count', threshold: 20 } },
  { id: 'swan-lake-15', journeyId: 'swan-lake', orderIndex: 15,
    title: 'Roses on the palace floor', artworkPath: '/rewards/swan-lake/15.svg',
    unlock: { kind: 'milestone_count', threshold: 5 } },
  { id: 'swan-lake-16', journeyId: 'swan-lake', orderIndex: 16,
    title: 'The grand ball begins', artworkPath: '/rewards/swan-lake/16.svg',
    unlock: { kind: 'mastered_count', threshold: 5 } },
  { id: 'swan-lake-17', journeyId: 'swan-lake', orderIndex: 17,
    title: 'Mysterious guests arrive', artworkPath: '/rewards/swan-lake/17.svg',
    unlock: { kind: 'session_count', threshold: 25 } },
  { id: 'swan-lake-18', journeyId: 'swan-lake', orderIndex: 18,
    title: 'Odile dances in disguise', artworkPath: '/rewards/swan-lake/18.svg',
    unlock: { kind: 'mastered_count', threshold: 6 } },
  { id: 'swan-lake-19', journeyId: 'swan-lake', orderIndex: 19,
    title: '32 fouettés', artworkPath: '/rewards/swan-lake/19.svg',
    unlock: { kind: 'session_count', threshold: 30 } },
  { id: 'swan-lake-20', journeyId: 'swan-lake', orderIndex: 20,
    title: 'Siegfried realizes the trick', artworkPath: '/rewards/swan-lake/20.svg',
    unlock: { kind: 'mastered_count', threshold: 7 } },
  { id: 'swan-lake-21', journeyId: 'swan-lake', orderIndex: 21,
    title: 'He races back to the lake', artworkPath: '/rewards/swan-lake/21.svg',
    unlock: { kind: 'session_count', threshold: 40 } },
  { id: 'swan-lake-22', journeyId: 'swan-lake', orderIndex: 22,
    title: 'A storm breaks over the water', artworkPath: '/rewards/swan-lake/22.svg',
    unlock: { kind: 'milestone_count', threshold: 10 } },
  { id: 'swan-lake-23', journeyId: 'swan-lake', orderIndex: 23,
    title: 'Love endures', artworkPath: '/rewards/swan-lake/23.svg',
    unlock: { kind: 'mastered_count', threshold: 8 } },
  { id: 'swan-lake-24', journeyId: 'swan-lake', orderIndex: 24,
    title: 'The swans take flight at dawn', artworkPath: '/rewards/swan-lake/24.svg',
    unlock: { kind: 'session_count', threshold: 50 } },
];
