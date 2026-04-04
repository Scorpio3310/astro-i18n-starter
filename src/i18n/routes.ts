/**
 * Route translations for different languages
 * Maps original route names to localized URLs
 * Example: "about" -> "o-projektu" for Slovenian
 * English routes use original names (not included here)
 */
export const routes: Record<string, Record<string, string>> = {
    sl: {
        about: "o-projektu",
        blog: "spletni-dnevnik",
        contact: "kontakt",
        "dynamic-routing": "dinamicno-usmerjanje",
        "blog-pagination": "spletni-dnevnik-paginacija",
        pages: "strani",
        "subpage-1": "podstran-1",
        "subpage-2": "podstran-2",
    },
};
