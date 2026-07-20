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
          customPages: [
              process.env.PRODUCTION_DOMAIN || "http://localhost:4321", // home page - priority 1.0
              (process.env.PRODUCTION_DOMAIN || "http://localhost:4321") +
                  "/sl/", // Slovenian home - priority 1.0
          ],
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