export const MIN_AGE = 3;
export const MAX_AGE = 120;

const DOB_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Compute the dancer's current age from a YYYY-MM-DD birthday. Returns null when the
 * input is empty or unparseable. `today` is injectable for tests; otherwise uses now.
 */
export function computeAge(dob: string | null, today: Date = new Date()): number | null {
  if (!dob || !DOB_FORMAT.test(dob)) return null;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Strict validator for user-submitted DOB strings. Rejects bad formats, impossible
 * dates (e.g. 2025-02-31), future dates, and ages outside [MIN_AGE, MAX_AGE].
 */
export function isValidDateOfBirth(value: string, today: Date = new Date()): boolean {
  if (!DOB_FORMAT.test(value)) return false;
  const birth = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return false;
  // Reject inputs like "2025-02-31" that JS silently rolls over to a valid date.
  if (birth.toISOString().slice(0, 10) !== value) return false;
  if (birth.getTime() > today.getTime()) return false;
  const age = computeAge(value, today);
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
}
