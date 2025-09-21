import { useCallback, useMemo, useState } from "react";

const DICT = {
  en: {
    nav: { features: "Features", how: "How it works", faq: "FAQ" },
    hero: {
      badge: "One‑click instant translation (auto translate coming soon)",
      title_prefix: "Talk to anyone,",
      title_suffix: "in any language",
      subtitle: "Lingua Link lets you chat seamlessly across languages with one‑click, accurate translations. Secure, fast, and designed for effortless conversations.",
      cta_primary: "Create your account",
      cta_secondary: "I already have an account"
    },
    playground: { title: "Try it now", subtitle: "Type a message and translate it instantly to any language." },
    how: "How it works",
    testimonials: "Loved by multilingual teams",
    faq: "Frequently asked questions",
  },
  es: {
    nav: { features: "Características", how: "Cómo funciona", faq: "Preguntas" },
    hero: {
      badge: "Traducción instantánea con un clic (auto pronto)",
      title_prefix: "Habla con cualquiera,",
      title_suffix: "en cualquier idioma",
      subtitle: "Lingua Link te permite chatear entre idiomas con traducción precisa de un clic. Seguro, rápido y sencillo.",
      cta_primary: "Crear cuenta",
      cta_secondary: "Ya tengo una cuenta"
    },
    playground: { title: "Pruébalo ahora", subtitle: "Escribe un mensaje y tradúcelo al instante a cualquier idioma." },
    how: "Cómo funciona",
    testimonials: "Equipos multilingües lo adoran",
    faq: "Preguntas frecuentes",
  },
  fr: {
    nav: { features: "Fonctionnalités", how: "Fonctionnement", faq: "FAQ" },
    hero: {
      badge: "Traduction instantanée en un clic (auto bientôt)",
      title_prefix: "Parlez à n’importe qui,",
      title_suffix: "dans n’importe quelle langue",
      subtitle: "Lingua Link permet de discuter entre langues avec une traduction précise en un clic. Sûr, rapide et sans effort.",
      cta_primary: "Créer un compte",
      cta_secondary: "J’ai déjà un compte"
    },
    playground: { title: "Essayez maintenant", subtitle: "Saisissez un message et traduisez-le instantanément dans n’importe quelle langue." },
    how: "Comment ça marche",
    testimonials: "Approuvé par des équipes multilingues",
    faq: "Questions fréquentes",
  }
};

function getInitialLang() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem("ll_lang") : null;
  if (stored && DICT[stored]) return stored;
  const nav = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : 'en';
  if (nav && DICT[nav]) return nav;
  return "en";
}

export function useLandingI18n() {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = useCallback((l) => {
    if (!DICT[l]) return;
    try { localStorage.setItem("ll_lang", l); } catch {}
    setLangState(l);
  }, []);

  const t = useCallback((path) => {
    const parts = path.split(".");
    const from = DICT[lang] || DICT.en;
    let cur = from;
    for (const p of parts) cur = cur?.[p];
    if (cur === undefined) {
      const base = DICT.en;
      let tmp = base;
      for (const p of parts) tmp = tmp?.[p];
      return tmp ?? path;
    }
    return cur;
  }, [lang]);

  const options = useMemo(() => ([
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
    { code: "fr", label: "FR" },
  ]), []);

  return { lang, setLang, t, options };
}