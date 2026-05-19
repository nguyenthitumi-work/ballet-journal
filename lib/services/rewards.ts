import { SEED_REWARD_SCENES, type UnlockRule } from '@/lib/data/seedRewards';

// State the unlock rules read from. Computed once per evaluateUnlocks call so
// the rules stay pure functions of a snapshot, not DB-coupled.
export interface RewardState {
  completedSessionCount: number;
  masteredSkillCount: number;
  milestoneCount: number;
  streak: number;
}

export function scenesUnlockedBy(state: RewardState): string[] {
  return SEED_REWARD_SCENES
    .filter((scene) => meetsUnlock(scene.unlock, state))
    .map((scene) => scene.id);
}

function meetsUnlock(rule: UnlockRule, state: RewardState): boolean {
  switch (rule.kind) {
    case 'session_count':
      return state.completedSessionCount >= rule.threshold;
    case 'mastered_count':
      return state.masteredSkillCount >= rule.threshold;
    case 'milestone_count':
      return state.milestoneCount >= rule.threshold;
    case 'streak':
      return state.streak >= rule.threshold;
  }
}
