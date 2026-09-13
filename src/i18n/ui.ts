/**
 * Dynamically import all locale JSON files
 * Loads files from /src/locales/[lang]/[namespace].json
 */
const localeModules = import.meta.glob("/src/locales/**/*.json", {
    eager: true,
});

/**
 * Available languages with display names
 */
export const languages = {
    en: "English",
    sl: "Slovenian",
};

/**
 * BCP-47 locale tags per language
 * Used for Intl date formatting and og:locale (with "-" replaced by "_")
 */
export const locales: Record<keyof typeof languages, string> = {
    en: "en-US",
    sl: "sl-SI",
};

/**
 * Default language for fallback translations
 */
export const defaultLang = "en";

/**
 * Whether to show default language in URLs (/en/about vs /about)
 */
export const showDefaultLang = false;

/**
 * UI translations object with nested structure: lang.namespace.key
 * Built from locale files automatically
 * Example: ui.en.common.nav_home -> "Home"
 */
export const ui = Object.entries(localeModules).reduce(
    (acc, [path, module]) => {
        const pathParts = path.split("/");
        const lang = pathParts[3]; // Extract language from path
        const namespace = pathParts[4].replace(".json", ""); // Extract filename as namespace
        const translations = (module as any).default || module;

        if (!acc[lang]) {
            acc[lang] = {};
        }

        // Create nested structure: lang.namespace.key
        acc[lang][namespace] = translations;
        return acc;
    },
    {} as Record<string, Record<string, Record<string, string>>>
);

/**
 * Type for translation keys
 * Supports both formats:
 * - "namespace:key" → t("common:menu.list.home")
 * - Direct keys → t("menu.list.home") (assumes "common" namespace)
 */
export type TranslationKey = string;
