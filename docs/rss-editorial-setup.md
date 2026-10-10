# PatriaSoul — RSS urednički nacrti

## Što radi automatizacija

- Svakih 30 minuta čita samo početno odobrene RSS izvore: Index.hr i Večernji list.
- Prihvaća samo HTTPS poveznice s dopuštenih domena, uključujući provjeru preusmjeravanja.
- Zadržava prijedloge iz posljednjih 36 sati, filtrira teme povezane s Hrvatskom i obrađuje najviše 5 prijedloga po pokretanju.
- Sprema prijedloge u tablicu `public.rss_editorial_drafts` projekta Supabase `ijimozjfdffejbczwyzb`.
- Administracija prikazuje prijedloge i omogućuje bilješke te statuse: čeka provjeru, pregledano, odbijeno i preuzeto u CMS.
- Ne stvara članak u CMS-u i ne objavljuje ništa automatski. Status „Preuzeto u CMS” samo je urednička oznaka; sam po sebi ništa ne prenosi.

## Jednokratno postavljanje GitHub tajne

Automatizacija je sigurno pauzirana dok nedostaje vjerodajnica za pisanje u bazu.

1. U Supabase nadzornoj ploči otvori projekt `kviz` (ref `ijimozjfdffejbczwyzb`).
2. U Project Settings / API Keys pronađi **secret/service_role key** za projekt. Nemoj koristiti publishable/anon ključ.
3. U GitHubu otvori repozitorij `cn-dom/ps` → **Settings → Secrets and variables → Actions → New repository secret**.
4. Naziv tajne: `SUPABASE_SERVICE_ROLE_KEY`.
5. Zalijepi tajnu kao vrijednost i spremi. Nikad je nemoj stavljati u kod, issue, commit ili chat.
6. Otvori Actions → **PatriaSoul · RSS urednički nacrti** i pokreni **Run workflow** za početni test. Provjeri log da piše koliko je prijedloga spremljeno.
7. U `stranice/administracija.html` pregledaj odjeljak **Prijedlozi vijesti**.

## Sigurnosni model

- Ključ s privilegijama baze koristi se samo kao GitHub Actions secret; nikad nije uključen u JavaScript preglednika.
- RLS je uključen na tablici. Anon uloga nema SELECT pristup; autentificirani korisnici trebaju proći postojeću provjeru uredničke uloge kroz `private.is_portal_editor()`.
- RSS sadržaj je nepouzdan podatak. Skripta ne izvršava upute iz feeda i ne preuzima puni tekst članka.
- Prijedlozi se dedupliciraju po izvornoj poveznici.
- Ako tajna nije postavljena, workflow upozori i preskoči prikupljanje umjesto da stvara javne nacrte.
