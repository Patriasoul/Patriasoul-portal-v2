# PatriaSoul — Sigurna strategija backupa

## Cilj

Omogućiti obnovu portala bez diranja produkcijskog GitHub Pages deploya.

## Trenutno stanje

- Portal ostaje na `main`.
- `.github/workflows/pages.yml` se ne mijenja.
- Recovery tablice u Supabaseu služe za evidenciju članaka, revizija, backup-runova, deploymenta i sistemskih događaja.
- Javna arhiva portala ne smije sadržavati SQL dump baze.

## Preporučeni backup

Supabase službeno podržava `supabase db dump` za odvojeni izvoz:

- roles
- schema
- data

Connection string mora biti spremljen kao GitHub Actions Secret:

`SUPABASE_DB_URL`

Dump treba završiti u privatnom artefaktu ili vanjskom privatnom spremištu, nikada u javnom Git repozitoriju.

## Minimalni postupak

1. GitHub → Settings → Secrets and variables → Actions.
2. Dodati repository secret `SUPABASE_DB_URL`.
3. Vrijednost uzeti iz Supabase Project Settings → Database → Connect.
4. Backup workflow pokretati dnevno ili ručno.
5. Nakon prvog backupa provjeriti da je artefakt stvarno nastao.
6. Periodično napraviti probni restore u potpuno novi/staging Supabase projekt.
7. Tek nakon uspješnog testa razmatrati produkcijski restore.

## Restore pravilo

Nikada ne raditi direktni restore na produkciju kao prvi pokušaj.

Redoslijed:

`backup → novi/staging projekt → provjera → odobrenje → produkcija`

## Što backup baze ne pokriva

PostgreSQL dump nije potpuna kopija cijelog Supabase projekta. Posebno treba zasebno zaštititi:

- Storage objektne datoteke
- Edge Function source
- projektne/API tajne
- Auth provider konfiguraciju
- ostale postavke izvan same baze

Portalni kod već je zaštićen GitHub repozitorijem; za Storage i ostale projektne postavke treba voditi zasebnu evidenciju.

## Namjerna zaštita

Ovaj dokument ne sadrži lozinku, connection string ni SQL podatke.

Stvarni backup workflow ne treba uvoditi u produkcijski deploy workflow. Njegov neuspjeh ne smije zaustaviti objavu portala.
