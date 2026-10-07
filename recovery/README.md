# PatriaSoul — Recovery

Ovaj direktorij sadrži samo upute. Stvarni database backup **nikada se ne sprema u javni GitHub repozitorij**.

## Zaštita portala

- GitHub Pages ostaje nepromijenjen.
- Produkcijski deploy workflow ostaje odvojen.
- Backup koristi Supabase CLI i GitHub Actions Secrets.
- SQL dumpovi se spremaju samo kao privatni workflow artefakti ili u privatno spremište.
- Restore se ne pokreće automatski.

## Potrebni GitHub Secret

`SUPABASE_DB_URL`

Vrijednost mora biti privatna Supabase PostgreSQL connection string vrijednost iz Project Settings → Database → Connect.

## Backup

Supabase CLI može napraviti tri odvojena izvoza:

1. roles
2. schema
3. data

Prije svakog stvarnog restorea treba napraviti test obnove u **novom/staging Supabase projektu**, a tek nakon provjere razmatrati produkciju.

## Pravilo

Nikada ne stavljati `roles.sql`, `schema.sql` ili `data.sql` u ovaj javni repozitorij.
