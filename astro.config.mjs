// @ts-check
import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // UPDATE THIS FOR PRODUCTION – This will also be used in the sitemap
  // astro:env can't be used in the config file itself, so process.env stays here
  site: process.env.PRODUCTION_DOMAIN || "http://localhost:4321",

  // No Astro.session usage: skip the KV session driver and its auto-provisioning on deploy
  session: false,

  env: {
      schema: {
          PRODUCTION_DOMAIN: envField.string({
              context: "server",
              access: "public",
              optional: true,
          }),
      },
  },

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