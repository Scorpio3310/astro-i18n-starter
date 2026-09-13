import { defaultLang, locales } from "@i18n/ui";

/**
 * Formats a date for the given language (e.g. "Mar 5, 2025" / "5. mar. 2025")
 * Falls back to the default language locale for unknown languages
 */
export function formatDate(
    date: string | number | Date,
    lang: string = defaultLang
): string {
    const locale = locales[lang as keyof typeof locales] ?? locales[defaultLang];
    return new Date(date).toLocaleDateString(locale, {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
