# PatriaSoul

**Hrvatska. Povijest. Znanje. Identitet.**

Novi, čisto organizirani PatriaSoul portal. Stari repozitorij `Patriasoul/Patriasoul-portal` ostaje netaknut kao izvor i sigurnosna kopija.

## Organizacija

- `index.html` — jedina naslovnica
- `stranice/` — stalne stranice: O PatriaSoul, Kontakt, Najnovije, Pretraga, prijava i registracija
- `kategorije/` — kategorije i njihove podstranice
- `clanci/` — svih 75 članaka, razvrstanih po tematskim cjelinama
- `cuvari-nasljedja/` — posebni dio Čuvari nasljeđa
- `kviz/` — Hrvatski kviz, sada dio istog repozitorija
- `assets/` — zajednički CSS, JavaScript i vizualni materijali
- `data/` — strukturirani podaci portala
- `scripts/qa/` — automatske provjere strukture, članaka, slika i linkova
- `.github/workflows/pages.yml` — GitHub Pages objava

## Pravilo organizacije

Ako nešto ne radi, tražimo problem u njegovom dijelu projekta:

- sadržaj članka → `clanci/`
- kategorija → `kategorije/`
- stalna stranica → `stranice/`
- kviz → `kviz/`
- dizajn → `assets/css/`
- ponašanje → `assets/js/`
- podaci → `data/`
- QA → `scripts/qa/`

## Uredničko načelo

> PatriaSoul ne nabraja Hrvatsku. PatriaSoul istražuje, provjerava i pripovijeda njezine priče.

Činjenica prije senzacije. Izvor prije tvrdnje. Sjećanje ima svoje mjesto, ali jasno razlikujemo činjenicu, tumačenje, svjedočanstvo i predaju.

## Hrvatski kviz

Kviz je dio istog projekta. Zadržava React/Vite aplikaciju i Supabase integraciju iz izvornog `Patriasoul/kviz` projekta, ali se objavljuje unutar `/kviz/` novog portala.
