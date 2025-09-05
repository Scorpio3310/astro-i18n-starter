import { ui, languages, defaultLang, showDefaultLang, type TranslationKey } from "./ui";
import { routes } from "./routes";
import { getCollection } from "astro:content";

//---------------------------------- EXPORTS ----------------------------------//
/**
 * Extracts language code from URL path
 * Example: "/sl/about" -> "sl", "/about" -> "en" (defaultLang)
 */
export function getLangFromUrl(url: URL) {
    const [, lang] = url.pathname.split("/");
    if (lang in ui) return lang as keyof typeof ui;
    return defaultLang;
}

/**
 * Returns translation function for specific language
 * Supports namespace:key format (e.g., "common:nav.home")
 * Falls back to defaultLang if translation not found
 */
export function useTranslations(lang: keyof typeof ui) {
    return function t(
        key: TranslationKey,
        params?: Record<string, string | number>
    ) {
        let namespace: string;
        let translationKey: string;

        // If no colon, assume "common" namespace
        if (!key.includes(":")) {
            namespace = "common";
            translationKey = key;
        } else {
            [namespace, translationKey] = key.split(":");
            if (!namespace || !translationKey) {
                return key;
            }
        }

        // Support nested object access with dot notation (e.g., "languages.en")
        const getNestedValue = (obj: any, path: string): any => {
            return path
                .split(".")
                .reduce((current, key) => current?.[key], obj);
        };

        const translation =
            getNestedValue(ui[lang]?.[namespace], translationKey) ||
            getNestedValue(ui[defaultLang]?.[namespace], translationKey) ||
            key;

        return params && typeof translation === "string"
            ? interpolateParams(translation, params)
            : translation;
    };
}

/**
 * Returns path translation function for specific language
 * Translates routes like "about" -> "o-projektu" for Slovenian
 */
export function useTranslatedPath(lang: keyof typeof ui) {
    return function translatePath(path: string, l: string = lang) {
        // Split path into segments
        const segments = path.split("/").filter((segment) => segment);

        // Translate each segment individually
        const translatedSegments = segments.map((segment) => {
            const translated = routes[l]?.[segment];
            return translated ?? segment;
        });

        const translatedPath = "/" + translatedSegments.join("/");

        return !showDefaultLang && l === defaultLang
            ? translatedPath
            : `/${l}${translatedPath}`;
    };
}

/**
 * Builds localized `getStaticPaths()` entries for a given English base path by
 * translating it with `useTranslatedPath(lang)` and mapping the resulting URL
 * segments into Astro route params according to a simple pattern.
 *
 * Pattern syntax:
 *  - Use plain names (e.g. "about", "dyn_routing", "subpage2") for fixed params
 *  - Use a leading "..." to mark the last (catch‑all) param (e.g. "...index", "...subpage1")
 *
 * Notes:
 *  - The catch‑all MUST be the last item in the pattern
 *  - Missing segments automatically become `undefined` (which Astro expects)
 *  - Works with any `defaultLang` + `showDefaultLang` combination
 *
 * Examples:
 *  - base: "/about", pattern: ["about", "...index"]
 *      → matches [about]/[...index].astro
 *  - base: "/dynamic-routing", pattern: ["dyn_routing", "...index"]
 *      → matches [dyn_routing]/[...index].astro
 *  - base: "/dynamic-routing/subpage-1", pattern: ["dyn_routing", "...subpage1"]
 *      → matches [dyn_routing]/[...subpage1].astro
 *  - base: "/dynamic-routing/subpage-2", pattern: ["dyn_routing", "subpage2", "...index"]
 *      → matches [dyn_routing]/[subpage2]/[...index].astro
 */
export function buildLocalizedStaticPaths(
    basePath: string,
    pattern: string[],
    extraProps?: (lang: string) => Record<string, any>
) {
    const langs = Object.keys(languages);
    return langs.map((code) => {
        // Translate the English basePath to the target language URL
        const translatePath = useTranslatedPath(code as any);
        const full = translatePath(basePath); // e.g. "/about" or "/sl/o-projektu"
        const segs = full.split("/").filter(Boolean); // split to path segments

        const params: Record<string, string | undefined> = {};
        for (let i = 0; i < pattern.length; i++) {
            const raw = pattern[i];
            const isCatchAll = raw.startsWith("...");
            const name = isCatchAll ? raw.slice(3) : raw;

            if (i < pattern.length - 1 && !isCatchAll) {
                // Fixed (non-catch‑all) param: take segment at the same index
                params[name] = segs[i]; // may be undefined for default language roots
            } else {
                // Catch‑all at the end: capture the rest of segments (or undefined)
                const rest = segs.slice(i).join("/");
                params[name] = rest || undefined; // Astro expects undefined when nothing to capture
                break;
            }
        }

        return {
            params,
            // Provide lang and any extra per‑language props
            props: { lang: code, ...(extraProps ? extraProps(code) : {}) },
        };
    });
}

/**
 * Switches current URL to target language while preserving content linking
 * Handles blog posts with different slugs per language
 */
export async function switchLanguageUrl(
    currentUrl: URL,
    targetLang: string
): Promise<string> {
    const pathname = currentUrl.pathname;
    const pathParts = pathname.split("/").filter((p) => p);

    // Remove current language prefix if it exists (for both default and non-default)
    const currentLang = getLangFromUrl(currentUrl);
    if (pathParts[0] && pathParts[0] in ui) {
        pathParts.shift();
    }

    // Handle root page
    if (pathParts.length === 0) {
        return !showDefaultLang && targetLang === defaultLang
            ? "/"
            : `/${targetLang}/`;
    }

    const baseRoute = pathParts[0];
    const slug = pathParts[1];

    // Handle blog post with content linking
    if (slug && isBlogRoute(baseRoute)) {
        return await handleBlogPostTranslation(
            currentLang,
            targetLang,
            baseRoute,
            slug,
            currentUrl.pathname
        );
    }

    // Handle other routes by translating all route segments
    const translatedSegments = pathParts.map((segment) => {
        return translateRouteName(segment, targetLang);
    });

    const newPath = translatedSegments.join("/");
    const prefix = !showDefaultLang && targetLang === defaultLang ? "" : `/${targetLang}`;
    return `${prefix}/${newPath}`;
}

//---------------------------------- FUNCTIONS ----------------------------------//
/**
 * Replaces {{key}} placeholders in text with provided parameters
 */
function interpolateParams(
    text: string,
    params: Record<string, string | number>
): string {
    return Object.entries(params).reduce(
        (result, [key, value]) =>
            result.replace(new RegExp(`{{${key}}}`, "g"), String(value)),
        text
    );
}

/**
 * Builds content links automatically from blog posts with linkedContent frontmatter
 * Returns mapping of linkedContent -> { lang: "lang/slug" }
 */
export async function buildContentLinks(): Promise<
    Record<string, Record<string, string>>
> {
    const allPosts = await getCollection(
        "blog",
        (entry) => !entry.data.isDraft
    );
    const links: Record<string, Record<string, string>> = {};

    allPosts.forEach((post) => {
        const { linkedContent } = post.data;
        if (linkedContent) {
            const [lang] = post.id.split("/");

            if (!links[linkedContent]) {
                links[linkedContent] = {};
            }
            links[linkedContent][lang] = post.id;
        }
    });

    return links;
}

/**
 * Finds content group for given collection ID using dynamic content links
 */
async function findContentGroup(collectionId: string): Promise<string | null> {
    const dynamicLinks = await buildContentLinks();
    return (
        Object.entries(dynamicLinks).find(([, links]) =>
            Object.values(links).includes(collectionId)
        )?.[0] || null
    );
}

/**
 * Checks if route is a blog route in any language
 */
function isBlogRoute(route: string): boolean {
    return route === "blog" || route === "spletni-dnevnik";
}

/**
 * Converts language to collection ID format (defaultLang -> "en")
 */
function getLangCode(lang: string): string {
    // Content folders use actual language codes (e.g., "en", "sl").
    // Do not remap defaultLang to "en" so changing defaultLang works seamlessly.
    return lang;
}

/**
 * Handles language switching for blog posts using content links mapping
 * Maps between different slugs per language (e.g., security-trends <-> varnostni-trendi)
 */
async function handleBlogPostTranslation(
    currentLang: string,
    targetLang: string,
    baseRoute: string,
    slug: string,
    fallbackPath: string
): Promise<string> {
    const currentPostId = `${getLangCode(currentLang)}/${slug}`;
    const contentGroup = await findContentGroup(currentPostId);

    if (contentGroup) {
        const dynamicLinks = await buildContentLinks();
        const targetPostId =
            dynamicLinks[contentGroup]?.[getLangCode(targetLang)];

        if (targetPostId) {
            const targetSlug = targetPostId.split("/")[1];
            const targetRouteName = translateRouteName(baseRoute, targetLang);
            const targetPath = `/${targetRouteName}/${targetSlug}`;

            const prefix =
                !showDefaultLang && targetLang === defaultLang
                    ? ""
                    : `/${targetLang}`;
            return `${prefix}${targetPath}`;
        }
    }

    return fallbackPath;
}

/**
 * Finds original route name from translated route
 * Example: "spletni-dnevnik" -> "blog"
 */
function getOriginalRouteName(routeName: string): string {
    for (const routeMap of Object.values(routes)) {
        const original = Object.entries(routeMap).find(
            ([, translated]) => translated === routeName
        )?.[0];
        if (original) return original;
    }
    return routeName;
}

/**
 * Translates route name to target language
 * Example: "blog" + "sl" -> "spletni-dnevnik"
 */
function translateRouteName(routeName: string, targetLang: string): string {
    const originalRoute = getOriginalRouteName(routeName);
    return routes[targetLang]?.[originalRoute] || originalRoute;
}
