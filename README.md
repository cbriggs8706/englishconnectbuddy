# EnglishConnect Buddy

Mobile-first language learning app to help Spanish and Portuguese speakers learn English using the EnglishConnect curriculum.

## Stack

- Next.js (App Router)
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Postgres + Storage + RLS)

## Features implemented

- Open access curriculum and games (no login required)
- Optional auth: users can sign in only to save progress
- Email/password auth + Google auth
- Quick language switcher: English, Spanish, Portuguese
- Thumb-friendly mobile bottom navigation
- Games:
  - Flashcards
  - Matching
  - Sentence Unscramble
- Admin-only content management (lessons, vocabulary, sentence scrambles)
- Supabase Storage uploads for vocab media in bucket `vocab`
- Lesson pattern image uploads in bucket `patterns` (English + Spanish + Portuguese)

## Curriculum structure

Lessons follow official-style sequencing fields:

- `level`
- `unit`
- `lesson_number`

## Supabase setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Fill values in `/Users/testing/Desktop/Websites/englishconnectbuddy/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (your production origin, e.g. `https://englishconnectbuddy.com`)

3. In Supabase SQL editor, run:

- `/Users/testing/Desktop/Websites/englishconnectbuddy/supabase/schema.sql`
- `/Users/testing/Desktop/Websites/englishconnectbuddy/supabase/seed_lessons.sql` (optional scaffold)
- `/Users/testing/Desktop/Websites/englishconnectbuddy/supabase/import_vocab.sql` (for spreadsheet import workflow)

`schema.sql` now also includes flashcard spaced-repetition tables/policies.

4. In Supabase Auth settings:

- Enable Google provider
- Add redirect URLs:
  - `http://localhost:3000/profile`
  - `https://your-production-domain.com/profile`
- Set site URL to your production origin (not localhost)

5. Create your account via the app (`/profile`), then promote your profile to admin in SQL editor:

```sql
update public.profiles
set is_admin = true
where id = 'YOUR-USER-UUID';
```

## Supabase CLI (recommended for migrations)

Supabase CLI is already supported in this repo (`supabase/` + `supabase/migrations`).

1. Log in once:

```bash
pnpm supabase:login
```

2. Set your project ref (from Supabase dashboard URL, e.g. `https://supabase.com/dashboard/project/<ref>`):

```bash
export SUPABASE_PROJECT_REF=your-project-ref
```

3. Link this repo to that project:

```bash
pnpm supabase:link
```

4. Push pending migrations (including streak tables/functions):

```bash
pnpm supabase:db:push
```

Useful checks:

```bash
pnpm supabase:status
pnpm supabase:db:pull
```

## Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- If Supabase is not configured yet, the app uses demo lesson/vocab data so UI and gameplay still work.
- Keep bucket `vocab` public for direct media playback in flashcards.
- Keep bucket `patterns` public for direct pattern image rendering.
- `seed_lessons.sql` creates a Level/Unit/Lesson scaffold with generated titles you can edit in admin.

## Spreadsheet import

If your sheet has columns like:

`id, lesson, type, eng, spa, por, spaTransliteration, porTransliteration, ipa, partOfSpeech, definition, image, engAudio`

Use `/Users/testing/Desktop/Websites/englishconnectbuddy/supabase/import_vocab.sql`:

1. Upload CSV rows into `public.vocab_import_staging` (Table Editor).
2. In the SQL file, set `target_level` to `1` (EC1) or `2` (EC2).
3. Run the insert block to map `lesson` -> `EC{level}.{sequence_number}`.

### Media path format for spreadsheet

You can keep media values as file paths like:

- `image`: `/english/i.webp`
- `engAudio`: `/english/i.mp3`

The app resolves these automatically to Supabase Storage public URLs in bucket `vocab`:

`https://<your-project>.supabase.co/storage/v1/object/public/vocab/english/i.mp3`

So just upload files to bucket `vocab` preserving the same folder/file names.
