export type CategoryId =
  | 'barre'
  | 'center'
  | 'jumps'
  | 'turns'
  | 'stretches'
  | 'conditioning';

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  barre: 'Barre',
  center: 'Center',
  jumps: 'Jumps',
  turns: 'Turns',
  stretches: 'Stretches',
  conditioning: 'Conditioning',
};

export const CATEGORY_BY_LABEL: Record<string, CategoryId> = {
  Barre: 'barre',
  Center: 'center',
  Jumps: 'jumps',
  Turns: 'turns',
  Stretches: 'stretches',
  Conditioning: 'conditioning',
};

export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type Rating = 1 | 2 | 3 | 4 | 5;
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface SkillCategory {
  id: CategoryId;
  name: string;
  displayOrder: number;
  iconName: string;
  brandColorHex: string;
}

export interface UserProfile {
  userId: string;
  name: string | null;
  age: number | null;
  level: Level;
  streak: number;
  lastPracticeDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  userId: string;
  categoryId: CategoryId;
  name: string;
  description: string | null;
  techniqueTips: string[];
  difficulty: Difficulty;
  defaultDurationSeconds: number;
  isCurrentlyWorkingOn: boolean;
  dateAdded: string;
  lastAttemptedAt: string | null;
  referenceUrl: string | null;
}

export interface PracticePlan {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isBuiltIn: boolean;
  orderedSkillIds: string[];
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  userId: string;
  planId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  moodRating: Rating | null;
  overallNotes: string | null;
}

export interface SkillAttempt {
  id: string;
  sessionId: string;
  skillId: string;
  rating: Rating;
  notes: string | null;
  isMilestone: boolean;
  attemptedAt: string;
  durationSeconds: number;
}

export interface SkillRow {
  id: string;
  user_id: string;
  category_id: CategoryId;
  name: string;
  description: string | null;
  technique_tips: string[];
  difficulty: number;
  default_duration_seconds: number;
  is_currently_working_on: boolean;
  date_added: string;
  last_attempted_at: string | null;
  reference_url: string | null;
}

export interface SkillCategoryRow {
  id: CategoryId;
  name: string;
  display_order: number;
  icon_name: string;
  brand_color_hex: string;
}

export interface UserProfileRow {
  user_id: string;
  name: string | null;
  age: number | null;
  level: Level;
  streak: number;
  last_practice_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticePlanRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_built_in: boolean;
  ordered_skill_ids: string[];
  created_at: string;
}

export interface PracticeSessionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  mood_rating: number | null;
  overall_notes: string | null;
}

export interface SkillAttemptRow {
  id: string;
  session_id: string;
  skill_id: string;
  rating: number;
  notes: string | null;
  is_milestone: boolean;
  attempted_at: string;
  duration_seconds: number;
}

export const skillFromRow = (r: SkillRow): Skill => ({
  id: r.id,
  userId: r.user_id,
  categoryId: r.category_id,
  name: r.name,
  description: r.description,
  techniqueTips: r.technique_tips,
  difficulty: r.difficulty as Difficulty,
  defaultDurationSeconds: r.default_duration_seconds,
  isCurrentlyWorkingOn: r.is_currently_working_on,
  dateAdded: r.date_added,
  lastAttemptedAt: r.last_attempted_at,
  referenceUrl: r.reference_url,
});

export const categoryFromRow = (r: SkillCategoryRow): SkillCategory => ({
  id: r.id,
  name: r.name,
  displayOrder: r.display_order,
  iconName: r.icon_name,
  brandColorHex: r.brand_color_hex,
});

export const profileFromRow = (r: UserProfileRow): UserProfile => ({
  userId: r.user_id,
  name: r.name,
  age: r.age,
  level: r.level,
  streak: r.streak,
  lastPracticeDate: r.last_practice_date,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const planFromRow = (r: PracticePlanRow): PracticePlan => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  description: r.description,
  isBuiltIn: r.is_built_in,
  orderedSkillIds: r.ordered_skill_ids,
  createdAt: r.created_at,
});

export const sessionFromRow = (r: PracticeSessionRow): PracticeSession => ({
  id: r.id,
  userId: r.user_id,
  planId: r.plan_id,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  durationSeconds: r.duration_seconds,
  moodRating: r.mood_rating as Rating | null,
  overallNotes: r.overall_notes,
});

export const attemptFromRow = (r: SkillAttemptRow): SkillAttempt => ({
  id: r.id,
  sessionId: r.session_id,
  skillId: r.skill_id,
  rating: r.rating as Rating,
  notes: r.notes,
  isMilestone: r.is_milestone,
  attemptedAt: r.attempted_at,
  durationSeconds: r.duration_seconds,
});
