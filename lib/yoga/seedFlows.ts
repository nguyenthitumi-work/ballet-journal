// Starter built-in flows. Mirrors lib/data/seedPlans.ts: a few ready-made,
// timed sequences so a new user can press "start" on day one. asanaId values
// must match SEED_ASANAS[].id.
import type { YogaFlow } from './types';

export const SEED_FLOWS: YogaFlow[] = [
  {
    id: 'wake-up-flow',
    name: 'Wake-Up Flow',
    description: 'A short, gentle sequence to greet the day and loosen the body.',
    style: 'wakeup',
    level: 'Beginner',
    isBuiltIn: true,
    poses: [
      { asanaId: 'childs-pose', holdSeconds: 60, side: 'center', breathCue: 'Five slow breaths into the back ribs.' },
      { asanaId: 'downward-dog', holdSeconds: 45, side: 'center', breathCue: 'Pedal the feet to wake the legs.' },
      { asanaId: 'mountain', holdSeconds: 30, side: 'center', breathCue: 'Inhale arms up, exhale to settle.' },
      { asanaId: 'tree', holdSeconds: 30, side: 'right', breathCue: 'Steady gaze, steady breath.' },
      { asanaId: 'tree', holdSeconds: 30, side: 'left', breathCue: 'Steady gaze, steady breath.' },
      { asanaId: 'corpse', holdSeconds: 90, side: 'center', breathCue: 'Let everything soften.' },
    ],
  },
  {
    id: 'strength-flow',
    name: 'Standing Strength',
    description: 'Build heat and leg strength through grounded standing poses.',
    style: 'power',
    level: 'Intermediate',
    isBuiltIn: true,
    poses: [
      { asanaId: 'downward-dog', holdSeconds: 45, side: 'center', breathCue: 'Find your foundation.' },
      { asanaId: 'warrior-1', holdSeconds: 30, side: 'right', breathCue: 'Reach up, ground down.' },
      { asanaId: 'warrior-2', holdSeconds: 30, side: 'right', breathCue: 'Sink and open.' },
      { asanaId: 'warrior-1', holdSeconds: 30, side: 'left', breathCue: 'Reach up, ground down.' },
      { asanaId: 'warrior-2', holdSeconds: 30, side: 'left', breathCue: 'Sink and open.' },
      { asanaId: 'chair', holdSeconds: 30, side: 'center', breathCue: 'Hug the midline, breathe.' },
      { asanaId: 'bridge', holdSeconds: 30, side: 'center', breathCue: 'Lift and open the chest.' },
      { asanaId: 'corpse', holdSeconds: 120, side: 'center', breathCue: 'Rest and integrate.' },
    ],
  },
  {
    id: 'wind-down-flow',
    name: 'Evening Wind-Down',
    description: 'A calming, mostly floor-based sequence to release the day.',
    style: 'yin',
    level: 'Beginner',
    isBuiltIn: true,
    poses: [
      { asanaId: 'childs-pose', holdSeconds: 60, side: 'center', breathCue: 'Arrive and slow down.' },
      { asanaId: 'cobra', holdSeconds: 20, side: 'center', breathCue: 'Gently open the front body.' },
      { asanaId: 'seated-forward-fold', holdSeconds: 60, side: 'center', breathCue: 'Fold on each exhale.' },
      { asanaId: 'twist-supine', holdSeconds: 45, side: 'right', breathCue: 'Let gravity twist you.' },
      { asanaId: 'twist-supine', holdSeconds: 45, side: 'left', breathCue: 'Let gravity twist you.' },
      { asanaId: 'corpse', holdSeconds: 180, side: 'center', breathCue: 'Complete stillness.' },
    ],
  },
];

export function getFlow(id: string): YogaFlow | undefined {
  return SEED_FLOWS.find((f) => f.id === id);
}
