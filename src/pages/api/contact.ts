export const prerender = false;

import type { APIRoute } from "astro";

const funkyMessages: Record<string, string[]> = {
    en: [
        "Boom! Message delivered faster than a caffeinated cheetah on roller skates.",
        "Your message just did a triple backflip into our inbox. Perfect landing.",
        "Message received! Our carrier pigeons are now officially unemployed.",
        "Houston, we have a message! And it's a beautiful one.",
        "Your words are now surfing the digital waves straight to our team.",
    ],
    sl: [
        "Bum! Sporočilo dostavljeno hitreje kot gepard na rolkah po kavi.",
        "Tvoje sporočilo je pravkar naredilo trojno salto v naš nabiralnik. Perfekten pristanek.",
        "Sporočilo prejeto! Naši poštni golobi so zdaj uradno brezposelni.",
        "Houston, imamo sporočilo! In je čudovito.",
        "Tvoje besede zdaj surfajo po digitalnih valovih naravnost do naše ekipe.",
    ],
};

const errorMessages: Record<string, Record<string, string>> = {
    en: {
        nameRequired: "Please enter your name.",
        nameMin: "Name must be at least 2 characters.",
        emailRequired: "Please enter your email address.",
        emailInvalid: "Please enter a valid email address.",
        messageRequired: "Please enter a message.",
        messageMin: "Message must be at least 10 characters.",
        genericError: "Something went wrong. Please try again.",
    },
    sl: {
        nameRequired: "Prosimo, vnesite svoje ime.",
        nameMin: "Ime mora imeti vsaj 2 znaka.",
        emailRequired: "Prosimo, vnesite e-poštni naslov.",
        emailInvalid: "Prosimo, vnesite veljaven e-poštni naslov.",
        messageRequired: "Prosimo, vnesite sporočilo.",
        messageMin: "Sporočilo mora imeti vsaj 10 znakov.",
        genericError: "Nekaj je šlo narobe. Prosimo, poskusite znova.",
    },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
    name: FormDataEntryValue | null,
    email: FormDataEntryValue | null,
    message: FormDataEntryValue | null,
    lang: string,
): Record<string, string> {
    const t = errorMessages[lang] || errorMessages.en;
    const errors: Record<string, string> = {};

    if (!name || String(name).trim() === "") {
        errors.name = t.nameRequired;
    } else if (String(name).trim().length < 2) {
        errors.name = t.nameMin;
    }

    if (!email || String(email).trim() === "") {
        errors.email = t.emailRequired;
    } else if (!EMAIL_REGEX.test(String(email).trim())) {
        errors.email = t.emailInvalid;
    }

    if (!message || String(message).trim() === "") {
        errors.message = t.messageRequired;
    } else if (String(message).trim().length < 10) {
        errors.message = t.messageMin;
    }

    return errors;
}

export const POST: APIRoute = async ({ request }) => {
    const referer = request.headers.get("referer") || "";
    const lang = referer.includes("/sl/") ? "sl" : "en";

    try {
        const data = await request.formData();
        const name = data.get("name");
        const email = data.get("email");
        const message = data.get("message");

        // Validate
        const errors = validate(name, email, message, lang);
        if (Object.keys(errors).length > 0) {
            return new Response(
                JSON.stringify({ success: false, errors }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Log form submission (replace with actual form handling logic)
        console.log("Contact Form Submission: ", { name, email, message });

        const messages = funkyMessages[lang];
        const funkyText = messages[Math.floor(Math.random() * messages.length)];

        return new Response(
            JSON.stringify({ success: true, message: funkyText }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        const t = errorMessages[lang] || errorMessages.en;
        return new Response(
            JSON.stringify({ success: false, message: t.genericError }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
};
