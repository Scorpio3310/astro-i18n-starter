/**
 * Dynamic robots.txt endpoint for Astro
 *
 * This API route serves different robots.txt content based on the environment:
 * - Development/staging: Blocks all crawlers (disallow all)
 * - Production: Allows crawlers and includes sitemap
 *
 * Environment detection is based on the PRODUCTION_DOMAIN environment variable.
 * If the current origin matches the production domain, serves production robots.txt,
 * otherwise serves the restrictive development version.
 *
 * Usage: Accessible at /robots.txt
 */

import type { APIRoute } from "astro";
import { PRODUCTION_DOMAIN } from "astro:env/server";
import DEV_ROBOTS_TXT from "@data/robots/dev_robots.txt?raw";
import PRODUCTION_ROBOTS_TXT from "@data/robots/production_robots.txt?raw";

export const GET: APIRoute = async ({ url }) => {
    // Check if current request origin matches production domain
    const isProd = PRODUCTION_DOMAIN
        ? url.origin.includes(PRODUCTION_DOMAIN)
        : false;

    let robotsContent = isProd ? PRODUCTION_ROBOTS_TXT : DEV_ROBOTS_TXT;

    // Replace domain placeholder in production robots
    if (isProd && PRODUCTION_DOMAIN) {
        robotsContent = robotsContent.replace(
            "{{PRODUCTION_DOMAIN}}",
            PRODUCTION_DOMAIN
        );
    }

    // Return robots.txt with proper content-type header
    return new Response(robotsContent, {
        headers: {
            "Content-Type": "text/plain",
        },
    });
};
