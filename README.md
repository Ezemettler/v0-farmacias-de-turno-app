# Farmacias de Turno

Directorio web que muestra, ciudad por ciudad, qué farmacias están de turno *ahora mismo* en Argentina. Los datos se extraen automáticamente todos los días desde las fuentes oficiales de cada ciudad (colegios de farmacéuticos, municipios, diarios locales) y se sirven en páginas por ciudad optimizadas para búsqueda ("farmacias de turno + [ciudad]").

`Next.js` `React` `TypeScript` `Supabase` `GitHub Actions` `Cloud Run`

## Qué problema resuelve

Cuando alguien necesita una farmacia de turno, hoy busca en Google y encuentra información desactualizada, en PDFs, o en la web de un colegio de farmacéuticos difícil de navegar. Este proyecto centraliza esa información en una sola página por ciudad, siempre actualizada, mostrando primero la farmacia que está de turno en este momento (no solo la de "hoy").

## Qué hace este proyecto

- **Extracción** — un scraper en TypeScript por ciudad visita la fuente oficial (sitio del colegio de farmacéuticos, municipio o diario local), parsea el HTML (o PDF, según la fuente) y normaliza los turnos a un formato común.
- **Carga** — los turnos se guardan en Supabase (Postgres) con un *upsert* idempotente por `(ciudad_slug, fecha_turno, nombre_farmacia)`, y cada corrida queda registrada en una tabla `scraper_runs` para poder auditar éxitos/fallos por ciudad y por día. Las farmacias cargadas manualmente (`es_override_manual`) nunca son pisadas por el scraper.
- **Automatización** — los scrapers corren dos veces por día (6:00 y 12:00 hora Argentina) vía GitHub Actions, y el mismo scraper está dockerizado para correr también en Cloud Run + Cloud Scheduler.
- **Presentación** — el frontend en Next.js consulta Supabase en cada request (con revalidación cada hora) y renderiza, por ciudad, la lista de farmacias con turno activo en este momento, calculado en base a la hora de Argentina.

## Arquitectura

```
Fuentes oficiales (colegios de farmacéuticos, municipios, diarios)
        │
        │  HTTP + cheerio / parseo de PDF (unpdf)
        ▼
scrapers/scrapers/{ciudad}/index.ts        ← 1 scraper por ciudad
        │
        │  normalización a ScrapedTurno
        ▼
scrapers/lib/upsert.ts
        │
        │  @supabase/supabase-js (service role)
        ▼
Supabase (Postgres)
   ├── farmacias_turno    ← turnos por ciudad/fecha/farmacia
   └── scraper_runs       ← historial de ejecuciones (status, filas, errores)
        │
        │  GitHub Actions (cron 09:00 y 15:00 UTC) + Cloud Run / Cloud Scheduler
        │
        ▼
lib/turnos.ts → fetchTurnos(ciudadSlug)
        │
        │  filtra por rango horario activo (inicio_turno ≤ ahora ≤ fin_turno)
        ▼
app/{ciudad}/page.tsx   (Next.js, revalidate: 1h)
        │
        ▼
Usuario ve la farmacia de turno ahora, con dirección, teléfono y horario
```

## Ciudades cubiertas

| Ciudad | Provincia | Fuente | Automatizado |
|---|---|---|---|
| San Nicolás de los Arroyos | Buenos Aires | diarioelnorte.com.ar | Sí |
| San Fernando | Buenos Aires | colfarmasanfdo.org.ar | Sí |
| Santa Rosa | La Pampa | infopico.com | Sí |
| General Pico | La Pampa | infopico.com | Sí |
| Venado Tuerto | Santa Fe | cofarsf.org.ar | Sí |
| San Rafael | Mendoza | informacionoficial.mendoza.gob.ar | Sí |
| San Pedro | Buenos Aires | — (sin fuente oficial scrapeable identificada) | No, carga manual en Supabase |

Cada scraper hereda de `BaseScraper` (fetch con user-agent de navegador real + timeout + manejo de errores) e implementa su propio parseo según el formato de la fuente (HTML con `cheerio`, tabs por día, tablas, o PDF).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui (Radix primitives) |
| Base de datos | Supabase (Postgres) |
| Scraping | Node.js / tsx, cheerio, unpdf (PDFs), date-fns-tz |
| Orquestación de scrapers | GitHub Actions (cron diario) + Docker/Cloud Run + Cloud Scheduler |
| Analytics | Google Analytics 4, Vercel Analytics |
| Hosting | Vercel |
| Monorepo | pnpm workspaces (`.` para el frontend, `scrapers/` para los scrapers) |

## Cómo correr el proyecto localmente

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Ezemettler/v0-farmacias-de-turno-app.git
cd v0-farmacias-de-turno-app
pnpm install
```

### 2. Configurar variables de entorno

Frontend (`.env.local`):

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
```

Scrapers (`scrapers/.env`):

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Levantar el frontend

```bash
pnpm dev
```

### 4. Correr los scrapers manualmente

```bash
cd scrapers
pnpm scrape              # todas las ciudades, fecha de hoy en Argentina
pnpm scrape:city         # una sola ciudad (ver run-city.ts)

# variables opcionales para correr una ciudad/fecha puntual:
TARGET_CIUDAD=santa-rosa TARGET_FECHA=2026-08-10 pnpm scrape
```

## Estado actual del proyecto

- **7 ciudades activas**, 6 con scraping automatizado y 1 (San Pedro) con carga manual por falta de fuente oficial scrapeable.
- Scraping corriendo dos veces al día en producción vía GitHub Actions; migración en curso a Cloud Run + Cloud Scheduler para mayor confiabilidad.
- Deploy continuo en Vercel, con Google Analytics y Vercel Analytics activos para medir tráfico.
- Sitio corriendo sobre el subdominio `farmaciasdeturno.vercel.app` (aún sin dominio propio).
- Próximos pasos: sumar más ciudades (SEO programático), agregar datos estructurados `schema.org/Pharmacy`, y explorar monetización vía listados patrocinados por farmacia.

## Autor

Ezequiel Mettler — [github.com/Ezemettler](https://github.com/Ezemettler)
