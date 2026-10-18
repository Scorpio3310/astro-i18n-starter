// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

import cloudflare from "@astrojs/cloudflare";

// .env files are not loaded in the config file, so read PRODUCTION_DOMAIN with Vite's
// loadEnv (https://docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file).
// Variables set in the shell/CI (e.g. Cloudflare Workers Builds) still take precedence.
const { PRODUCTION_DOMAIN } = loadEnv(
  process.env.NODE_ENV ?? "production",
  process.cwd(),
  "",
);

// https://astro.build/config
export default defineConfig({
  // Production domain from .env / build environment – also used for canonical URLs and the sitemap
  site: PRODUCTION_DOMAIN || "http://localhost:4321",

  // No Astro.session usage: skip the KV session driver and its auto-provisioning on deploy
  session: false,

  integrations: [
      mdx(),
      sitemap({
          changefreq: "monthly",
          priority: 0.7,
          lastmod: new Date(),
      }),
      svelte(),
  ],

  vite: {
      plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});