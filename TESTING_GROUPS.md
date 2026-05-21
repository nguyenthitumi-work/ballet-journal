# Testing Guide: Families and Classes

This guide walks through testing the new parent/teacher viewing features.

## Prerequisites

1. Apply the migration:
   ```bash
   # If using Supabase CLI locally
   supabase db push
   
   # Or via SQL editor in Supabase dashboard
   # Run the migration file: supabase/migrations/20260520000000_add_families_and_classes.sql
   ```

2. Ensure `NEXT_PUBLIC_BASE_URL` is set in `.env.local` (e.g., `http://localhost:3000`)

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Test Scenario 1: Parent Views Kid's Practice

### Setup
1. Create two accounts:
   - **Kid account**: Sign up as a student (e.g., `kid@example.com`)
   - **Parent account**: Sign up as a parent (e.g., `parent@example.com`)

2. As the kid:
   - Complete onboarding (name, birthday, level)
   - Add a skill and complete a practice session
   - Navigate to Settings
   - Under "Family" section, click "+ Create Family"
   - Name it (e.g., "Smith Family")
   - Under the family card, select "Code" + "Parent" role
   - Click "Generate Code" — save the code that appears

3. As the parent:
   - Sign in to parent account
   - Navigate to Settings
   - Under "Family" section, you should see a pending invite (if using code path, parent needs to manually enter code via accept-invite URL)
   - **Alternative**: Use email invite instead:
     - As kid, select "Email" + "Parent" role
     - Enter parent's email and click "Send Email"
     - Parent receives invite email with link
     - Click link to accept

### Verification
1. As parent:
   - In top navigation, verify "Viewing: [dropdown]" appears
   - Select kid's name from dropdown
   - Navigate to History — should see kid's practice sessions
   - Open a session detail
   - Click "+ Add note" in the amber Notes section
   - Add a note (e.g., "Great posture on that plié!")
   - Verify note appears with parent's name and timestamp

2. As kid:
   - Navigate to History
   - Open the same session
   - Verify parent's note is visible
   - Kid should NOT see "+ Add note" (cannot comment on own sessions via this UI)

## Test Scenario 2: Teacher Views Student's Practice

### Setup
1. Create two accounts:
   - **Student account**: Sign up as a student (e.g., `student@example.com`)
   - **Teacher account**: Sign up as a teacher (e.g., `teacher@example.com`)

2. As the teacher:
   - Navigate to Settings
   - Under "Classes" section, click "+ Create Class"
   - Name it (e.g., "Ballet Fundamentals")
   - Click "Generate Invite Code" — save the code
   - **Or** use email invite:
     - Select "Email" + "Student" role
     - Enter student's email and click "Send Email"

3. As the student:
   - Complete onboarding and create practice sessions
   - Accept teacher's invite (code or email link)

### Verification
1. As teacher:
   - In top navigation, select student from "Viewing:" dropdown
   - Navigate to History — see student's sessions
   - Open a session and add a note
   - Verify note appears

2. As student:
   - View own history
   - Verify teacher's note is visible

## Edge Cases to Test

1. **Multiple families**: Kid is in two families (e.g., mom and dad separate), both parents can view
2. **Multiple classes**: Student in two classes, both teachers can view
3. **Self-viewing**: When viewing own account, "Viewing:" dropdown shows "You" and notes are read-only
4. **No invites**: User with no families/classes sees no dropdown in nav
5. **Expired invite**: Invite link older than 30 days shows "expired" message

## Known Limitations (Phase 1)

- Teachers/parents can only add notes, not modify skills or sessions
- No skill assignments yet (Phase 2)
- Email invites require Supabase Auth configuration
- Class invite codes are persistent (not time-limited like invite records)

## Troubleshooting

### "Invite not found" error
- Check invite hasn't expired (30 days default)
- Verify user is signed in before clicking invite link
- Check database: `SELECT * FROM invite WHERE accepted_at IS NULL;`

### Can't see dropdown in nav
- Verify user is a member of at least one family or class
- Check: `SELECT * FROM family_member WHERE user_id = '<your-user-id>';`
- Check: `SELECT * FROM class_member WHERE user_id = '<your-user-id>';`

### Notes not appearing
- Verify RLS policies are in place: `\dp practice_note` in psql
- Check can_view_dancer() function exists
- Ensure viewed dancer has sessions with notes

### Database query errors
- Verify migration ran successfully
- Check all new tables exist: `\dt` in psql should show `family`, `family_member`, `class`, `class_member`, `invite`, `practice_note`
