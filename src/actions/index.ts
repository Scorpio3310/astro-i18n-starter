import { defineAction } from "astro:actions";
import { z } from "astro/zod";

// Same pattern as the client-side validation in [contact]/[...index].astro
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
import en from "@/locales/en/contact.json";
import sl from "@/locales/sl/contact.json";

// Success messages live in the locale files (single source of truth)
const funkyMessages: Record<"en" | "sl", string[]> = {
    en: en.funky,
    sl: sl.funky,
};

export const server = {
    contact: defineAction({
        accept: "form",
        // Validation messages are stable keys — the client maps them to
        // the localized strings already embedded in the form's data-validation
        input: z.object({
            name: z
                .string({ error: "nameRequired" })
                .trim()
                .min(2, "nameMin"),
            email: z
                .string({ error: "emailRequired" })
                .trim()
                .min(1, "emailRequired")
                .regex(EMAIL_REGEX, "emailInvalid"),
            message: z
                .string({ error: "messageRequired" })
                .trim()
                .min(10, "messageMin"),
            lang: z.enum(["en", "sl"]).catch("en"),
            // Honeypot — humans never see this field, bots fill it
            website: z.string().nullish(),
        }),
        handler: async ({ name, email, message, lang, website }) => {
            const messages = funkyMessages[lang];
            const funkyText =
                messages[Math.floor(Math.random() * messages.length)];

            // Honeypot tripped: pretend success without processing
            if (website) {
                return { message: funkyText };
            }

            // Log form submission (replace with actual form handling logic)
            console.log("Contact Form Submission: ", { name, email, message });

            return { message: funkyText };
        },
    }),
};
