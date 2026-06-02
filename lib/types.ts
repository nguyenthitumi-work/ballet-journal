import { normalizeTheme, type ThemeId } from './themes';

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
export type ProgressStatus = 'learning' | 'practicing' | 'mastered';

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
  dateOfBirth: string | null;
  level: Level;
  streak: number;
  lastPracticeDate: string | null;
  dailySkillGoal: number;
  colorTheme: ThemeId;
  rewardsBackfilledAt: string | null;
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
  trains: string[];
  difficulty: Difficulty;
  level: Level;
  defaultDurationSeconds: number;
  isCurrentlyWorkingOn: boolean;
  progressStatus: ProgressStatus;
  dateAdded: string;
  lastAttemptedAt: string | null;
  referenceUrl: string | null;
  referenceUrlSuggested: string | null;
  referenceUrlSuggestedAt: string | null;
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
  orderedSkillIds: string[];
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
  videoPath: string | null;
  videoSizeBytes: number | null;
  photoPath: string | null;
  photoSizeBytes: number | null;
}

export interface SkillRow {
  id: string;
  user_id: string;
  category_id: CategoryId;
  name: string;
  description: string | null;
  technique_tips: string[];
  trains: string[] | null;
  difficulty: number;
  level: Level;
  default_duration_seconds: number;
  is_currently_working_on: boolean;
  progress_status: ProgressStatus;
  date_added: string;
  last_attempted_at: string | null;
  reference_url: string | null;
  reference_url_suggested: string | null;
  reference_url_suggested_at: string | null;
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
  date_of_birth: string | null;
  level: Level;
  streak: number;
  last_practice_date: string | null;
  daily_skill_goal: number;
  color_theme: string | null;
  rewards_backfilled_at: string | null;
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
  ordered_skill_ids: string[];
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
  video_path: string | null;
  video_size_bytes: number | null;
  photo_path: string | null;
  photo_size_bytes: number | null;
}

export interface WeeklySummary {
  windowStartIso: string;
  windowEndIso: string;
  priorWindowStartIso: string;
  practiceTimeSec: number;
  practiceTimeSecPrior: number;
  sessionsCount: number;
  sessionsCountPrior: number;
  skillsPracticedCount: number;
  mostPracticed: { skillId: string; skillName: string; totalSec: number } | null;
  milestonesCount: number;
  masteredSkills: { id: string; name: string; changedAt: string }[];
  improvedSkills: {
    id: string;
    name: string;
    priorAvg: number;
    currentAvg: number;
    priorAttempts: number;
    currentAttempts: number;
  }[];
  hasAnyActivity: boolean;
  hasPriorBaseline: boolean;
}

export const skillFromRow = (r: SkillRow): Skill => ({
  id: r.id,
  userId: r.user_id,
  categoryId: r.category_id,
  name: r.name,
  description: r.description,
  techniqueTips: r.technique_tips,
  trains: r.trains ?? [],
  difficulty: r.difficulty as Difficulty,
  level: r.level,
  defaultDurationSeconds: r.default_duration_seconds,
  isCurrentlyWorkingOn: r.is_currently_working_on,
  progressStatus: r.progress_status,
  dateAdded: r.date_added,
  lastAttemptedAt: r.last_attempted_at,
  referenceUrl: r.reference_url,
  referenceUrlSuggested: r.reference_url_suggested,
  referenceUrlSuggestedAt: r.reference_url_suggested_at,
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
  dateOfBirth: r.date_of_birth,
  level: r.level,
  streak: r.streak,
  lastPracticeDate: r.last_practice_date,
  dailySkillGoal: r.daily_skill_goal,
  colorTheme: normalizeTheme(r.color_theme),
  rewardsBackfilledAt: r.rewards_backfilled_at,
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
  orderedSkillIds: r.ordered_skill_ids ?? [],
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
  videoPath: r.video_path,
  videoSizeBytes: r.video_size_bytes,
  photoPath: r.photo_path,
  photoSizeBytes: r.photo_size_bytes,
});

export type FamilyRole = 'parent' | 'dancer';
export type ClassRole = 'teacher' | 'student';
export type InviteTargetRole = FamilyRole | ClassRole;

export interface Family {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface FamilyMember {
  familyId: string;
  userId: string;
  role: FamilyRole;
  joinedAt: string;
  userName: string | null;
}

export interface Class {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string | null;
  createdAt: string;
}

export interface ClassMember {
  classId: string;
  userId: string;
  role: ClassRole;
  joinedAt: string;
  userName: string | null;
}

export interface Invite {
  id: string;
  targetFamilyId: string | null;
  targetClassId: string | null;
  targetRole: InviteTargetRole;
  code: string | null;
  email: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  createdBy: string;
  createdAt: string;
}

export interface PracticeNote {
  id: string;
  sessionId: string | null;
  attemptId: string | null;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface FamilyRow {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMemberRow {
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  user_name?: string | null;
}

export interface ClassRow {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string | null;
  created_at: string;
}

export interface ClassMemberRow {
  class_id: string;
  user_id: string;
  role: ClassRole;
  joined_at: string;
  user_name?: string | null;
}

export interface InviteRow {
  id: string;
  target_family_id: string | null;
  target_class_id: string | null;
  target_role: InviteTargetRole;
  code: string | null;
  email: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_by: string;
  created_at: string;
}

export interface PracticeNoteRow {
  id: string;
  session_id: string | null;
  attempt_id: string | null;
  author_user_id: string;
  body: string;
  created_at: string;
}

export const familyFromRow = (r: FamilyRow): Family => ({
  id: r.id,
  name: r.name,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

export const familyMemberFromRow = (r: FamilyMemberRow): FamilyMember => ({
  familyId: r.family_id,
  userId: r.user_id,
  role: r.role,
  joinedAt: r.joined_at,
  userName: r.user_name ?? null,
});

export const classFromRow = (r: ClassRow): Class => ({
  id: r.id,
  name: r.name,
  ownerId: r.owner_id,
  inviteCode: r.invite_code,
  createdAt: r.created_at,
});

export const classMemberFromRow = (r: ClassMemberRow): ClassMember => ({
  classId: r.class_id,
  userId: r.user_id,
  role: r.role,
  joinedAt: r.joined_at,
  userName: r.user_name ?? null,
});

export const inviteFromRow = (r: InviteRow): Invite => ({
  id: r.id,
  targetFamilyId: r.target_family_id,
  targetClassId: r.target_class_id,
  targetRole: r.target_role,
  code: r.code,
  email: r.email,
  expiresAt: r.expires_at,
  acceptedAt: r.accepted_at,
  acceptedBy: r.accepted_by,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

export const practiceNoteFromRow = (r: PracticeNoteRow): PracticeNote => ({
  id: r.id,
  sessionId: r.session_id,
  attemptId: r.attempt_id,
  authorUserId: r.author_user_id,
  body: r.body,
  createdAt: r.created_at,
});
