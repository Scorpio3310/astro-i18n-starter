# AGENTS.md

Operating manual for AI coding agents (Claude Code, Codex, Cursor, GitHub Copilot, …) working in this repository. Read it before you change code. Human docs: `README.md` and the in-site docs in `src/pages/[about]/_about-<lang>.mdx` and `src/pages/[pages]/_pages-<lang>.mdx`.

## Overview

Astro i18n Starter is a multilingual Astro starter with fully localized URLs (`/about` ↔ `/sl/o-projektu`). English (`en`) is the default language and has no URL prefix; Slovenian (`sl`) lives under `/sl/`. The i18n routing is custom on purpose: Astro's built-in `i18n` config is not used.

**Stack:** Astro 7.4 · `@astrojs/cloudflare` 14.4 (static output; only `404.astro` and Astro Actions run on demand in the Worker) · `@astrojs/mdx` · `@astrojs/svelte` (Svelte 5) · `@astrojs/sitemap` · Tailwind CSS 4 via `@tailwindcss/vite` · TypeScript 6.x · pnpm 11 · Node >= 22.22.

**Branch:** this is `main`, the simpler variant. Every page's `getStaticPaths()` lists its `en`/`sl` params by hand, and `defaultLang`/`showDefaultLang` in `src/i18n/ui.ts` must stay as they are. The other branch, `feat/i18n-routing-helper`, generates those params with `buildLocalizedStaticPaths()` from `routes.ts` + `languages`, so a new language needs no page edits and `defaultLang`/`showDefaultLang` actually work. The two branches diverged long ago and are maintained separately: re-apply a change on the other branch by hand, never merge or cherry-pick between them.

## Commands

```bash
pnpm install              # Node >= 22.22, pnpm 11
cp .env.example .env      # only once the real domain is known; then set PRODUCTION_DOMAIN in it
pnpm dev                  # astro dev → http://localhost:4321
pnpm build                # astro build → dist/client (static files) + dist/server (Worker)
pnpm preview              # serves the last build through the Cloudflare adapter (workerd)
pnpm check                # astro check → expect 0 errors, 0 warnings, 0 hints
npx tsc --noEmit -p .     # plain TypeScript check → expect no output (run `pnpm check` or `pnpm astro sync` first: they generate .astro/types.d.ts)
pnpm exec wrangler deploy # deploy to Cloudflare Workers; only when the user asks
```

Gotchas (checked on Astro 7.4):

- **Dev/preview run in the background for agents.** On macOS/Linux, when Astro detects an AI agent, `pnpm dev` and `pnpm preview` start a detached server, print its URL and return right away. Manage them with `pnpm astro dev status|logs|stop` and `pnpm astro preview status|logs|stop`; their output is JSON. A lock file (`.astro/dev.json` / `.astro/preview.json`) prevents a second server: running `pnpm dev` again only reports the one already running, even with a different `--port`, so the port may not be 4321. Use `pnpm astro dev --force` (or `pnpm astro preview --force`) to replace it. Readiness check (dev only): `curl -s localhost:4321/_astro/status` returns `{"ok":true}`. Use `localhost`, not `127.0.0.1`: the server can listen on IPv6 loopback (`::1`) only. To stay in the foreground, use `ASTRO_DEV_BACKGROUND=0 pnpm dev` or `ASTRO_PREVIEW_BACKGROUND=0 pnpm preview`. **Stop every server you started before you finish.**
- Dev and preview both default to port 4321. Stop one before starting the other, or give each its own `--port`. If the port is taken, preview silently moves to the next free one, but its start message and `pnpm astro preview status` still show the requested URL. The real `Local` URL is in `.astro/preview.log`.
- `pnpm preview` serves the existing `dist/`, so rebuild first.
- Trailing slashes: Cloudflare (also `pnpm preview`) answers `/sl/o-projektu` with a 307 to `/sl/o-projektu/`. Internal links and hreflang have no trailing slash (except home URLs such as `/sl/`); the sitemap, canonical and `og:url` (from `Astro.url`) do. Known open issue; don't change trailing-slash handling unless asked.
- The first `pnpm dev` after a dependency or config change can fail once with a missing chunk under `node_modules/.vite/deps_ssr/` (Vite re-optimizes deps). Restart the dev server; it is not a project bug.
- Without `PRODUCTION_DOMAIN`, `site` falls back to `http://localhost:4321` and `robots.txt` disallows everything. That is expected for local builds. `.env.example` holds a placeholder domain, so an unedited copy makes `robots.txt` allow crawling and points canonical, hreflang and the sitemap at `your-domain.com`.
- pnpm 11 blocks dependency build scripts that are not approved: `allowBuilds` in `pnpm-workspace.yaml` approves `esbuild` and `workerd`. Add any new dependency that needs a build script there.

## Project map

| Path | Owns |
| --- | --- |
| `astro.config.mjs` | `site` from `PRODUCTION_DOMAIN` (Vite `loadEnv`), integrations (mdx, sitemap, svelte), Tailwind Vite plugin, Cloudflare adapter, `session: false` |
| `wrangler.jsonc` | Worker `name` (`astro-i18n-starter`), compatibility date, static assets from `./dist/client` |
| `pnpm-workspace.yaml` | `allowBuilds` for dependency build scripts (`esbuild`, `workerd`) |
| `src/i18n/ui.ts` | `languages`, `locales` (BCP-47 tags), `defaultLang`, `showDefaultLang`, and `ui` (every locale JSON, loaded with `import.meta.glob`) |
| `src/i18n/routes.ts` | Per-language URL segment translations (`routes.sl.about = "o-projektu"`). Keys are English segments, so English has no entry |
| `src/i18n/utils.ts` | `getLangFromUrl`, `useTranslations`, `useTranslatedPath`, `switchLanguageUrl`, `buildContentLinks` |
| `src/locales/<lang>/<namespace>.json` | UI strings. The file name is the namespace: `common`, `main`, `blog`, `contact`, `routing`, `component` |
| `src/pages/` | Localized routes (see the routing section). `_*.mdx` files are page content, not routes |
| `src/pages/[about]/_about-<lang>.mdx`, `src/pages/[pages]/_pages-<lang>.mdx` | In-site docs, one MDX file per language |
| `src/pages/404.astro` | On-demand, localized 404 (`prerender = false`, so it can read the language from the requested URL) |
| `src/pages/robots.txt.ts` | Prerendered robots.txt: `src/data/robots/production_robots.txt` (`{{SITEMAP_URL}}` placeholder) when `site` is a real domain, otherwise `dev_robots.txt` (block all) |
| `src/content.config.ts`, `src/content/` | `blog` collection (`src/content/blog/<lang>/<slug>.md(x)`, id = `<lang>/<slug>`, images in `src/content/blog/images/` via `@blogImages/*`) and `authors` collection (`src/content/authors/authors.json`) |
| `src/actions/index.ts` | `contact` Astro Action (form input, zod validation with stable error keys, `website` honeypot, localized success messages); runs on the Worker |
| `src/layouts/Base.astro` | `<html lang>`, title/meta, favicons, canonical, hreflang + `x-default`, OG/Twitter, `og:locale`, JSON-LD, `<ClientRouter />`, Header/Footer. Props: `title`, `meta: { description, image?, type?, url?, keywords?, canonical?, robots? }` |
| `src/components/` | `Header` (nav + mobile menu), `Footer`, `LanguagePicker`, `Pagination`, `Info` (note box), `Counter.svelte` (demo) |
| `src/data/navigationData.ts` | Nav tree for Header and Footer: `label` = `common` key, `href` = English path, optional `children` |
| `src/styles/global.css` | The only Tailwind entry (`@import "tailwindcss"`, `@theme` colors `main` and `primary`) plus base styles |
| `src/styles/markdown.css` | `.md-content` typography (`@reference "./global.css"`) |
| `src/utils/utils.ts` | `formatDate(date, lang)` using `locales` |
| `public/` | `favicon/` (with `site.webmanifest`), `og-image.jpg` (default OG image, 1200×630), `github-image.jpg` (used only by the README) |
| `tsconfig.json` | Aliases `@/*`, `@assets/*`, `@blogImages/*`, `@components/*`, `@data/*`, `@i18n/*`, `@layouts/*`, `@styles/*`, `@utils/*` |

Generated folders: `.astro/`, `dist/`, `.wrangler/`, `node_modules/`. Never edit them.

## How i18n routing works on this branch

Route folders and files use English names in brackets, so one file renders every language. The params are positional slots, not meanings: a **named param holds exactly one URL segment** (`about` for `en`, the `sl` prefix for `sl`), and the trailing **rest param holds the rest**, which may span several segments, or `undefined`. Every entry gets `props: { lang }`. On `main`, each `getStaticPaths()` lists one entry per language by hand:

```astro
---
// src/pages/[about]/[...index].astro
export function getStaticPaths() {
    return [
        { params: { about: "about", index: undefined }, props: { lang: "en" } }, // /about
        { params: { about: "sl", index: "o-projektu" }, props: { lang: "sl" } }, // /sl/o-projektu
    ];
}

const { lang } = Astro.props;
---
```

| File (params) | en | sl |
| --- | --- | --- |
| `[...index].astro` (`index: "/"` / `"sl/"`) | `/` | `/sl/` |
| `[...blog].astro` (`blog: "/blog"` / `"/sl/spletni-dnevnik"`) | `/blog` | `/sl/spletni-dnevnik` |
| `[about]/[...index].astro` | `/about` | `/sl/o-projektu` |
| `[pages]/[...index].astro` | `/pages` | `/sl/strani` |
| `[contact]/[...index].astro` | `/contact` | `/sl/kontakt` |
| `[dyn_routing]/[...index].astro` | `/dynamic-routing` | `/sl/dinamicno-usmerjanje` |
| `[dyn_routing]/[...subpage1].astro` | `/dynamic-routing/subpage-1` | `/sl/dinamicno-usmerjanje/podstran-1` |
| `[dyn_routing]/[subpage2]/[...index].astro` | `/dynamic-routing/subpage-2` | `/sl/dinamicno-usmerjanje/podstran-2` |
| `[blog]/[...slug].astro` (`langConfigs`) | `/blog/<slug>` | `/sl/spletni-dnevnik/<slug>` |
| `[pagination]/[...page].astro` (`langConfigs` + `paginate()`, `PAGE_SIZE = 4`) | `/blog-pagination`, `/blog-pagination/2` | `/sl/spletni-dnevnik-paginacija`, `…/2` |

- `src/i18n/routes.ts` **does not create pages** on this branch. It drives links (`useTranslatedPath`), the language picker and hreflang (`switchLanguageUrl`). The localized segments written in `getStaticPaths()` must match `routes.ts` exactly, or links and language switching point to 404s.
- Segment translation is per segment and global: `routes.sl["subpage-1"]` applies wherever `subpage-1` appears. Segments without an entry stay English. Keep translated values unique, because `switchLanguageUrl()` maps them back.
- Every URL must come from exactly one page file. Several files share a param shape (for example `[dyn_routing]/[...index]` and `[dyn_routing]/[...subpage1]`) and only coexist because they emit different URLs.
- Links: `const translatePath = useTranslatedPath(lang); translatePath("/dynamic-routing/subpage-1")` gives `/dynamic-routing/subpage-1` or `/sl/dinamicno-usmerjanje/podstran-1`. Always pass absolute English paths.
- Language: pages read `lang` from `Astro.props`; `Base.astro`, `Header`, `Footer`, `LanguagePicker` and the on-demand `404.astro` call `getLangFromUrl(Astro.url)`. The first URL segment counts as a language only if `src/locales/<code>/` exists; otherwise it is `defaultLang`.
- Switching and hreflang: `switchLanguageUrl(url, lang)` translates each segment and maps blog posts through `linkedContent`. `Base.astro` emits hreflang only for languages that have an equivalent page.
- `defaultLang`/`showDefaultLang` exist in `ui.ts` and the utils read them, but the hand-written paths assume `en` is the unprefixed default. **Do not change them on `main`** (see "Change the default language or URL prefix").

## Recipes

### Add a translated page (`/services` ↔ `/sl/storitve`)

1. `src/i18n/routes.ts`: add the segment for every language except English: `services: "storitve",` under `sl`.
2. Create `src/pages/[services]/[...index].astro` (same shape as `[contact]/[...index].astro`):

    ```astro
    ---
    // Imports
    import { useTranslations } from "@i18n/utils";
    import Base from "@layouts/Base.astro";

    export function getStaticPaths() {
        return [
            // English route: /services
            { params: { services: "services", index: undefined }, props: { lang: "en" } },
            // Slovenian route: /sl/storitve
            { params: { services: "sl", index: "storitve" }, props: { lang: "sl" } },
        ];
    }

    // Props
    const { lang } = Astro.props;

    // Translations
    const t = useTranslations(lang);
    ---

    <Base
        title={t("services:head.title")}
        meta={{
            description: t("services:head.description"),
            keywords: t("services:head.keywords"),
        }}
    >
        <section aria-labelledby="services-title">
            <h1 id="services-title">{t("services:title")}</h1>
            <p>{t("services:description")}</p>
        </section>
    </Base>
    ```

3. Strings: create `src/locales/en/services.json` and `src/locales/sl/services.json` with the same keys (`head.title`, `head.description`, `head.keywords`, `title`, `description`). New namespaces load automatically. For long content, use MDX instead: copy `src/pages/[about]/[...index].astro`, rename the `about` param to `services` in both entries, change the import to ``./_services-${lang}.mdx``, and add `_services-en.mdx` / `_services-sl.mdx` next to the page with `title`/`description`/`keywords` frontmatter. Keep `import "@styles/markdown.css"` and the `<section class="md-content">` wrapper. Every language needs its MDX file or the build fails. `services.json` is then optional, but the nav label is still required.
4. Add a nav item (below) if the page belongs in the menu, then run "Verify before finishing".
5. Result: `/services` and `/sl/storitve`. The sitemap, hreflang and the language picker pick them up automatically.

Single-file variant: `src/pages/[...services].astro` with `params: { services: "/services" }` and `params: { services: "/sl/storitve" }`, like `[...blog].astro`. Sub-pages follow `src/pages/[dyn_routing]/`: `[services]/[...web].astro` with `{ services: "services", web: "web" }` / `{ services: "sl", web: "storitve/splet" }`, or nested `[services]/[web]/[...index].astro` with `{ services: "services", web: "web", index: undefined }` / `{ services: "sl", web: "storitve", index: "splet" }`. Add `web: "splet"` to `routes.ts`.

### Add or change a route segment

- **Rename a localized slug:** change it in `routes.ts` **and** in every `getStaticPaths()` that emits it. Find them with `grep -rn "dinamicno-usmerjanje" src`. The real occurrences are `routes.ts` and the `getStaticPaths()` params of the three `[dyn_routing]` files; their comments and `<pre>` samples are cosmetic, and the hits in `_about-*.mdx`/`_pages-*.mdx` (code samples) and `src/locales/*/routing.json` (description text) are documentation only. `spletni-dnevnik` is emitted by `[...blog].astro` and the `slugPrefix` in `[blog]/[...slug].astro`. Match it exactly: `spletni-dnevnik-paginacija` is a different key (`blog-pagination`), emitted by `[pagination]/[...page].astro`.
- **Rename an English segment:** change the `routes.ts` key, the English params in every `getStaticPaths()` that emits it, the `navigationData.ts` `href`s and every `translatePath("/old")` call. For `blog`, also change the `"blog"` literal in `isBlogRoute()` in `src/i18n/utils.ts`, or blog posts lose language switching. The bracket folder name can stay. Old URLs are not redirected.

### Add UI strings

Add the same key to `src/locales/en/<ns>.json` and `src/locales/sl/<ns>.json`, using the same structure. A new namespace is a new file in every language folder; `import.meta.glob` loads it, no registration needed.

```astro
---
import { getLangFromUrl, useTranslations } from "@i18n/utils";
const lang = getLangFromUrl(Astro.url); // in a page: const { lang } = Astro.props;
const t = useTranslations(lang);
---
<p>{t("blog:readMore")}</p>                  <!-- "namespace:key.path" -->
<p>{t("footer.description")}</p>             <!-- no prefix = "common" namespace -->
<p>{t("footer.made", { what: "Astro" })}</p> <!-- {{what}} interpolation -->
```

- A missing key falls back to `defaultLang`, then renders the key itself. The build does not fail, so a raw key on the page means a missing string.
- Arrays and objects are returned as-is (`t("main:features")`).
- Never import `@i18n/*` in a client `<script>` or a hydrated component: `ui.ts` eagerly bundles every locale file and `utils.ts` imports `astro:content`. Pass translated strings in instead: props for Svelte islands (`<Counter client:load translations={{ title: t("component:framework", { framework: "Svelte" }), body: t("component:body") }} />`), a `data-*` attribute for scripts (the contact form's `data-validation={JSON.stringify({...})}`).

### Add a blog post in both languages

`src/content/blog/en/my-post.md` (the file name is the URL slug; the entry id is `en/my-post`). Frontmatter schema: `src/content.config.ts`.

```yaml
---
title: "My Post"
linkedContent: "my-post"           # identical in every language version
description: "Short summary."
keywords: "comma, separated"       # optional
author: "Nik Klemenc"              # an id from src/content/authors/authors.json
pubDate: 2025-10-01
isDraft: false                     # required; true hides the post everywhere
image: "@blogImages/image-1.png"   # required
imageAlt: "Image description"      # optional, falls back to title
---
```

Then add `src/content/blog/sl/moja-objava.md` with the same `linkedContent` and translated fields. Result: `/blog/my-post` ↔ `/sl/spletni-dnevnik/moja-objava`. The listing, pagination, detail pages, sitemap, hreflang and language picker pick it up automatically. Without a shared `linkedContent`, the picker keeps the current URL for that language and no hreflang is emitted. A new author needs an entry in `authors.json` with `id`, `name`, `image` (path relative to the JSON file) and `position.en`/`position.sl`.

### Add a nav item

```ts
// src/data/navigationData.ts
{
    label: "menu.list.services", // key in common.json (both languages), no namespace prefix
    href: "/services",           // English path; translatePath() localizes it
    children: [],                // optional dropdown items: { label, href }
},
```

Also add `menu.list.services` to `src/locales/en/common.json` and `src/locales/sl/common.json`. Header renders `children` as a dropdown and sets `aria-current`. Footer lists top-level items only.

### Add a language (example: `de`)

1. `src/i18n/ui.ts`: add `de: "German"` to `languages` and `de: "de-DE"` to `locales`.
2. `src/locales/de/`: copy every namespace file from `en/` and translate it. Language detection needs this folder. Add `menu.languages.de` (the language picker label) to `common.json` in **every** language.
3. `src/i18n/routes.ts`: add a `de: { … }` map with every key that `sl` has (`about: "ueber-uns"`, …).
4. Pages: add a `de` entry to `getStaticPaths()` in `[...index].astro` (`"de/"`), `[...blog].astro`, `[about]/`, `[pages]/`, `[contact]/` and the three `[dyn_routing]/` files. Add a `de` row to `langConfigs` in `[blog]/[...slug].astro` and `[pagination]/[...page].astro`.
5. `src/pages/[about]/_about-de.mdx` and `src/pages/[pages]/_pages-de.mdx`.
6. Blog: add `de: z.string()` to the authors `position` object in `src/content.config.ts` and `position.de` to every author in `authors.json`. Widen the `"en" | "sl"` casts in `[...blog].astro` and `[blog]/[...slug].astro` (types only). Add posts in `src/content/blog/de/` with matching `linkedContent`. Translate every post so each language has the same number of posts and pagination pages; otherwise hreflang and the picker on `/blog-pagination/N` link to `/de/…/N` pages that don't exist. Check with the hreflang grep on `dist/client/sl/spletni-dnevnik-paginacija/2/index.html`.
7. `src/actions/index.ts`: import `@/locales/de/contact.json`, add `de: de.funky` to `funkyMessages`, widen its type to `Record<"en" | "sl" | "de", string[]>`, and use `z.enum(["en", "sl", "de"])` (otherwise German submissions get English messages).

`Base.astro` (hreflang, `og:locale`), `LanguagePicker` and `formatDate` read `languages`/`locales`, so they need no changes. To drop a language, reverse these steps.

### Change the default language or URL prefix

Not supported on `main`: the hand-written `getStaticPaths()` entries assume `en` is the unprefixed default. Keep `defaultLang = "en"` and `showDefaultLang = false` in `src/i18n/ui.ts`. If you need another default language or a prefixed default (`/en/about`), use `feat/i18n-routing-helper`, where both settings work without editing page files.

## Conventions and constraints

- Keep the custom i18n. Don't add an `i18n` key to `astro.config.mjs`, `astro:i18n` helpers or an i18n library.
- Keep TypeScript on 6.x, because `@astrojs/check` does not support TS 7. **Never run `pnpm up --latest`.** Bump specific packages on purpose (edit the specifiers in `package.json`, then `pnpm install`) and run the full verify list.
- When bumping Astro, also update the README badge and Tech Stack line and the `Astro (v7.4)` text in the features list of `src/locales/{en,sl}/main.json`.
- Everything is prerendered except `404.astro` and Actions. The root rest routes (`[...index].astro`, `[...blog].astro`) match any URL and are safe only because `getStaticPaths()` lists exact URLs. **Never put `export const prerender = false` on a `[...rest]` page or set `output: "server"`**: an on-demand catch-all swallows other URLs and the 404. Server logic goes into Astro Actions (`src/actions/`) or a dedicated non-catch-all route.
- Named params hold exactly one URL segment; rest params hold the rest. Never put `a/b` into a named param.
- Keep English and Slovenian in sync: every route, locale key, MDX file and linked blog post exists in both languages, changed in the same change.
- Client scripts: bundled `<script>`s run once, while `<ClientRouter />` swaps the DOM on navigation. Bind element listeners inside `document.addEventListener("astro:page-load", init)` (contact form), or use delegated `document` listeners (Header menu, LanguagePicker). Navigate from scripts with `navigate()` from `astro:transitions/client`.
- Look up keys that come from URLs or input with `Object.hasOwn(...)` (`ui`, `routes`, `locales`), not `in` or truthy indexing, so a segment like `constructor` never resolves to `Object.prototype`.
- Tailwind 4: only `src/styles/global.css` has `@import "tailwindcss"` and `@theme` (`--color-main`, `--color-primary`). Other stylesheets and `<style>` blocks that use `@apply` start with `@reference` to it: `@reference "./global.css";` in `markdown.css`, `@reference "../../styles/global.css";` in `[contact]/[...index].astro`. Never add a second `@import "tailwindcss"`.
- Rendered Markdown/MDX goes inside `class="md-content"` with `import "@styles/markdown.css"`.
- Images: use `<Image>` from `astro:assets`. Content images use `layout="constrained"` + `width` (+ `sizes` in grids), avatars use `layout="fixed"` + `width`/`height`, the above-the-fold image (blog post hero) uses `priority`, and everything else uses `loading="lazy"`. Always set `alt`.
- Accessibility: use semantic elements without redundant landmark roles (no `role` on `<header>`, `<nav>`, `<main>`, `<footer>`). Give nav regions an `aria-label`, mark the current link with `aria-current="page"`, give the disclosure button `aria-expanded`/`aria-controls`, and keep form labels and the error/status live regions.
- SEO: every page renders through `Base.astro` with `title` and `meta.description` (plus `keywords` when available). Don't hand-write canonical or hreflang tags.
- `PRODUCTION_DOMAIN` is read only in `astro.config.mjs`. Use `Astro.site` in code. Sessions are off (`session: false`), so don't use `Astro.session`.
- Svelte components use Svelte 5 runes (`$props`, `$state`, `$derived`).
- Code style: 4-space indent, double quotes, semicolons, short section comments (`// Imports`, `// Props`, `// Translations`). Match the file you edit.
- Astro 7 is newer than most training data. Check unfamiliar APIs in the current docs at https://docs.astro.build instead of relying on memory.
- Don't commit, push, tag or deploy unless the user asks.

## Verify before finishing

```bash
pnpm check                # expect: 0 errors, 0 warnings, 0 hints
npx tsc --noEmit -p .     # expect: no output, exit code 0
pnpm build                # expect: "[build] Complete!"
```

Then check the build output:

- **Page count:** `find dist/client -name '*.html' | wc -l` gives **32** for the demo (16 per language: home, about, pages, contact, 3 dynamic-routing pages, blog listing, 6 posts, 2 pagination pages), plus the prerendered `/robots.txt`. Each new page adds one per language. `404.astro` is on demand, so it is not counted.
- **Both languages:** every new page exists in both, e.g. `dist/client/services/index.html` and `dist/client/sl/storitve/index.html`.
- **Sitemap:** `dist/client/sitemap-index.xml` exists and `dist/client/sitemap-0.xml` lists every page in both languages (32 `<loc>` entries for the demo).
- **robots.txt:** without `.env` / `PRODUCTION_DOMAIN`, `dist/client/robots.txt` has `Disallow: /` for all bots. `PRODUCTION_DOMAIN=https://example.com pnpm build` gives an empty `Disallow:` (allow) plus `Sitemap: https://example.com/sitemap-index.xml`. Run a plain `pnpm build` again afterwards.
- **hreflang** after route or content changes: `grep -o 'hreflang="[^"]*" href="[^"]*"' dist/client/sl/<page>/index.html` lists `en`, `x-default` and `sl` URLs that exist (demo: `sl/o-projektu/index.html`).
- **Runtime** for UI or behaviour changes: `pnpm preview`, then test both languages, the language picker and an unknown URL (`/sl/xyz` must return the Slovenian 404 with status 404). Stop it with `pnpm astro preview stop`.

## Clean start: turning the starter into your site

**Keep (the engine):** `src/i18n/`, `src/layouts/Base.astro`, `Header`/`Footer`/`LanguagePicker`, `src/pages/404.astro`, `src/pages/robots.txt.ts` + `src/data/robots/`, `src/data/navigationData.ts`, `src/content.config.ts`, `src/utils/utils.ts`, `src/styles/`, the config files (`astro.config.mjs`, `wrangler.jsonc`, `pnpm-workspace.yaml`, `tsconfig.json` with its aliases), and the `common.json` keys `menu.toggle`, `menu.languagesText`, `menu.languages`, `footer.*` and `pageNotFound.*` (layout components and the 404 page use them). Keep `getStaticPaths()` in `src/pages/[...index].astro`, but replace its template (it renders `main:features` and a GitHub button) and `main.json` in both languages. Keep a `main:title` key: Header and Footer use it as the logo link's `aria-label`.

**Remove the demo features you don't need.** Each row is independent, except "Whole blog", which also needs the "Pagination example" row. Run the checks after each one.

| Demo feature | Delete | Also update |
| --- | --- | --- |
| Dynamic routing examples | `src/pages/[dyn_routing]/`, `src/components/Counter.svelte`, `src/locales/*/routing.json`, `src/locales/*/component.json` | `routes.ts` keys `dynamic-routing`, `subpage-1`, `subpage-2`; nav entry `menu.list.dynamicRouting` with its children and labels |
| Pagination example | `src/pages/[pagination]/`, `src/components/Pagination.astro` | `routes.ts` key `blog-pagination`; nav `menu.list.pagination`; `blog.json` keys `descriptionPagination`, `totalPosts`, `paginationExample`, `pagination` |
| In-site docs | `src/pages/[about]/`, `src/pages/[pages]/` (or rewrite their MDX) | `routes.ts` keys `about`, `pages`; nav entries |
| Contact form | `src/pages/[contact]/`, `src/actions/index.ts`, `src/components/Info.astro`, `src/locales/*/contact.json` | `routes.ts` key `contact`; nav. If you keep it, replace the `console.log` in the action with real delivery and rewrite the `funky` messages |
| Demo posts | `src/content/blog/{en,sl}/*.md`, `src/content/blog/images/*` | add your own posts; replace `authors.json` and `user.png`, and update `author:` in your posts |
| Whole blog | the demo posts plus `src/pages/[...blog].astro`, `src/pages/[blog]/`, `src/locales/*/blog.json`, and everything in the "Pagination example" row | `routes.ts` key `blog`; nav. Either keep the `blog` and `authors` collections in `content.config.ts` plus `src/content/authors/` (the glob loader only warns about the missing blog folder), or remove the collections and also remove from `src/i18n/utils.ts` the `getCollection` import, the `ContentLinks` type, `contentLinksPromise`, `loadContentLinks`, `buildContentLinks`, `isBlogRoute`, `handleBlogPostTranslation`, and in `switchLanguageUrl()` the blog branch plus the then-unused `baseRoute` and `slug`; otherwise `pnpm check` fails or warns |

To keep only one blog listing with pagination, delete `src/pages/[...blog].astro` instead of the "Pagination example" row, point the `menu.list.blog` nav item to `/blog-pagination` and remove `menu.list.pagination`.

Without `Counter.svelte` nothing uses Svelte. To drop it: `pnpm remove @astrojs/svelte svelte`, delete `svelte.config.js`, and in `astro.config.mjs` remove both the `import svelte from "@astrojs/svelte";` line and `svelte()` from `integrations`.

**Rename and rebrand:**

- `package.json`: `name`, `version`, `description`, `author`, `homepage`, `repository`, `keywords`.
- `wrangler.jsonc`: `name` (the Cloudflare Worker name). `.env`: `PRODUCTION_DOMAIN`, and the same variable in your CI or Workers Builds environment.
- `src/layouts/Base.astro`: the `// Astro i18n Starter` title suffix, `apple-mobile-web-app-title`, `theme-color`.
- `src/assets/logo.svg` (Header and Footer), `public/og-image.jpg` (1200×630), `public/favicon/*` and `site.webmanifest` (`name`, `short_name`, colors). Delete `public/github-image.jpg`.
- `src/components/Header.astro`: the GitHub icon link. `src/components/Footer.astro`: the `https://www.klemenc.si` credit link; `footer.*` strings in both `common.json` files.
- `src/styles/global.css` `@theme` colors.
- `README.md`, this file (overview, route table, expected page count), and `LICENSE` (the starter is MIT © Nik Klemenc; keep that notice and add your own).

Then run "Verify before finishing". The expected HTML count becomes (pages per language) × 2.
