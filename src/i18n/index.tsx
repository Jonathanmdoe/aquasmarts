import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";


export type Lang = "en" | "sw" | "fr" | "es" | "pt";

export const LANGUAGES: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "sw", label: "Swahili", native: "Kiswahili", flag: "🇹🇿" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Portuguese", native: "Português", flag: "🇵🇹" },
];

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  sw: "Swahili (Kiswahili)",
  fr: "French (Français)",
  es: "Spanish (Español)",
  pt: "Portuguese (Português)",
};

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.batches": "Batches",
  "nav.finance": "Finance",
  "nav.market": "Market",
  "nav.more": "More",
  "nav.feed": "Feed",
  "nav.health": "Health",
  "nav.console": "Console",
  "nav.users": "Users",
  "nav.moderate": "Moderate",
  "nav.tickets": "Tickets",

  "common.loading": "Loading...",
  "common.welcome": "Welcome",
  "common.save": "Save Changes",
  "common.saving": "Saving...",
  "common.language": "Language",
  "common.languageDesc": "Choose the language used across the app and AI answers",

  "more.title": "More",
  "more.subtitle": "Explore all features and tools",
  "more.section.admin": "Admin",
  "more.section.account": "Account",
  "more.section.operations": "Operations",
  "more.section.farm": "Farm",
  "more.section.preferences": "Preferences",
  "more.adminDashboard": "Admin Dashboard",
  "more.adminDashboard.desc": "Platform overview",
  "more.settings": "Settings",
  "more.settings.desc": "Profile & farm",
  "more.subscription": "Subscription",
  "more.subscription.desc": "Manage your plan",
  "more.batches": "Batches",
  "more.batches.desc": "Fish batches",
  "more.finance": "Finance",
  "more.finance.desc": "P&L & records",
  "more.marketplace": "Marketplace",
  "more.marketplace.desc": "Buy & sell",
  "more.sales": "Sales Records",
  "more.sales.desc": "Buyers & deliveries",
  "more.listings": "My Listings",
  "more.listings.desc": "Marketplace items",
  "more.ai": "AI Predictions",
  "more.ai.desc": "Harvest & cost insights",
  "more.growth": "Growth & Sampling",
  "more.growth.desc": "Weight, length & growth curve",
  "more.water": "Water Quality",
  "more.water.desc": "Pond readings",
  "more.feeding": "Feeding",
  "more.feeding.desc": "Feed logs",
  "more.health": "Health",
  "more.health.desc": "Disease & treatment",
  "more.notifications": "Notifications",
  "more.notifications.desc": "Alert preferences",
  "more.security": "Security",
  "more.security.desc": "Password & 2FA",
  "more.help": "Help & Support",
  "more.help.desc": "FAQs & contact",

  "worker.view": "Worker view",
  "worker.activeBatches": "Active batches",
  "worker.feedingsToday": "Feedings today",
  "worker.ponds": "Ponds",
  "worker.todaysTasks": "Today's Tasks",
  "worker.noBatches": "No active batches assigned yet.",
  "worker.water": "Water",
  "worker.health": "Health",
  "worker.feed": "Feed",
  "worker.batches": "Batches",
};

const sw: Dict = {
  "nav.home": "Nyumbani",
  "nav.batches": "Makundi",
  "nav.finance": "Fedha",
  "nav.market": "Soko",
  "nav.more": "Zaidi",
  "nav.feed": "Chakula",
  "nav.health": "Afya",
  "nav.console": "Kidhibiti",
  "nav.users": "Watumiaji",
  "nav.moderate": "Usimamizi",
  "nav.tickets": "Tiketi",

  "common.loading": "Inapakia...",
  "common.welcome": "Karibu",
  "common.save": "Hifadhi Mabadiliko",
  "common.saving": "Inahifadhi...",
  "common.language": "Lugha",
  "common.languageDesc": "Chagua lugha itakayotumika kwenye programu na majibu ya AI",

  "more.title": "Zaidi",
  "more.subtitle": "Gundua huduma na zana zote",
  "more.section.admin": "Msimamizi",
  "more.section.account": "Akaunti",
  "more.section.operations": "Shughuli",
  "more.section.farm": "Shamba",
  "more.section.preferences": "Mapendeleo",
  "more.adminDashboard": "Dashibodi ya Msimamizi",
  "more.adminDashboard.desc": "Muhtasari wa mfumo",
  "more.settings": "Mipangilio",
  "more.settings.desc": "Wasifu na shamba",
  "more.subscription": "Kifurushi",
  "more.subscription.desc": "Simamia mpango wako",
  "more.batches": "Makundi",
  "more.batches.desc": "Makundi ya samaki",
  "more.finance": "Fedha",
  "more.finance.desc": "Faida/hasara na kumbukumbu",
  "more.marketplace": "Soko",
  "more.marketplace.desc": "Nunua na uuze",
  "more.sales": "Kumbukumbu za Mauzo",
  "more.sales.desc": "Wanunuzi na usafirishaji",
  "more.listings": "Matangazo Yangu",
  "more.listings.desc": "Bidhaa sokoni",
  "more.ai": "Utabiri wa AI",
  "more.ai.desc": "Mavuno na gharama",
  "more.growth": "Ukuaji na Sampuli",
  "more.growth.desc": "Uzito, urefu na mkondo wa ukuaji",
  "more.water": "Ubora wa Maji",
  "more.water.desc": "Vipimo vya bwawa",
  "more.feeding": "Ulishaji",
  "more.feeding.desc": "Kumbukumbu za chakula",
  "more.health": "Afya",
  "more.health.desc": "Magonjwa na matibabu",
  "more.notifications": "Arifa",
  "more.notifications.desc": "Mapendeleo ya arifa",
  "more.security": "Usalama",
  "more.security.desc": "Nenosiri na 2FA",
  "more.help": "Msaada",
  "more.help.desc": "Maswali na mawasiliano",

  "worker.view": "Mtazamo wa mfanyakazi",
  "worker.activeBatches": "Makundi hai",
  "worker.feedingsToday": "Ulishaji leo",
  "worker.ponds": "Mabwawa",
  "worker.todaysTasks": "Kazi za Leo",
  "worker.noBatches": "Hakuna makundi hai uliyopewa bado.",
  "worker.water": "Maji",
  "worker.health": "Afya",
  "worker.feed": "Chakula",
  "worker.batches": "Makundi",
};

const fr: Dict = {
  "nav.home": "Accueil",
  "nav.batches": "Lots",
  "nav.finance": "Finances",
  "nav.market": "Marché",
  "nav.more": "Plus",
  "nav.feed": "Aliment",
  "nav.health": "Santé",
  "nav.console": "Console",
  "nav.users": "Utilisateurs",
  "nav.moderate": "Modération",
  "nav.tickets": "Tickets",

  "common.loading": "Chargement...",
  "common.welcome": "Bienvenue",
  "common.save": "Enregistrer",
  "common.saving": "Enregistrement...",
  "common.language": "Langue",
  "common.languageDesc": "Choisissez la langue de l'application et des réponses de l'IA",

  "more.title": "Plus",
  "more.subtitle": "Découvrez toutes les fonctionnalités",
  "more.section.admin": "Administration",
  "more.section.account": "Compte",
  "more.section.operations": "Opérations",
  "more.section.farm": "Ferme",
  "more.section.preferences": "Préférences",
  "more.adminDashboard": "Tableau de bord admin",
  "more.adminDashboard.desc": "Vue de la plateforme",
  "more.settings": "Paramètres",
  "more.settings.desc": "Profil et ferme",
  "more.subscription": "Abonnement",
  "more.subscription.desc": "Gérer votre offre",
  "more.batches": "Lots",
  "more.batches.desc": "Lots de poissons",
  "more.finance": "Finances",
  "more.finance.desc": "Résultats et écritures",
  "more.marketplace": "Marché",
  "more.marketplace.desc": "Acheter et vendre",
  "more.sales": "Ventes",
  "more.sales.desc": "Acheteurs et livraisons",
  "more.listings": "Mes annonces",
  "more.listings.desc": "Articles du marché",
  "more.ai": "Prévisions IA",
  "more.ai.desc": "Récolte et coûts",
  "more.growth": "Croissance",
  "more.growth.desc": "Poids, longueur et courbe",
  "more.water": "Qualité de l'eau",
  "more.water.desc": "Mesures des bassins",
  "more.feeding": "Alimentation",
  "more.feeding.desc": "Journaux d'aliment",
  "more.health": "Santé",
  "more.health.desc": "Maladies et traitements",
  "more.notifications": "Notifications",
  "more.notifications.desc": "Préférences d'alertes",
  "more.security": "Sécurité",
  "more.security.desc": "Mot de passe et 2FA",
  "more.help": "Aide",
  "more.help.desc": "FAQ et contact",

  "worker.view": "Vue employé",
  "worker.activeBatches": "Lots actifs",
  "worker.feedingsToday": "Repas aujourd'hui",
  "worker.ponds": "Bassins",
  "worker.todaysTasks": "Tâches du jour",
  "worker.noBatches": "Aucun lot actif attribué.",
  "worker.water": "Eau",
  "worker.health": "Santé",
  "worker.feed": "Aliment",
  "worker.batches": "Lots",
};

const es: Dict = {
  "nav.home": "Inicio",
  "nav.batches": "Lotes",
  "nav.finance": "Finanzas",
  "nav.market": "Mercado",
  "nav.more": "Más",
  "nav.feed": "Alimento",
  "nav.health": "Salud",
  "nav.console": "Consola",
  "nav.users": "Usuarios",
  "nav.moderate": "Moderación",
  "nav.tickets": "Tickets",

  "common.loading": "Cargando...",
  "common.welcome": "Bienvenido",
  "common.save": "Guardar cambios",
  "common.saving": "Guardando...",
  "common.language": "Idioma",
  "common.languageDesc": "Elige el idioma de la app y de las respuestas de la IA",

  "more.title": "Más",
  "more.subtitle": "Explora todas las funciones",
  "more.section.admin": "Administración",
  "more.section.account": "Cuenta",
  "more.section.operations": "Operaciones",
  "more.section.farm": "Granja",
  "more.section.preferences": "Preferencias",
  "more.adminDashboard": "Panel de administración",
  "more.adminDashboard.desc": "Vista de la plataforma",
  "more.settings": "Ajustes",
  "more.settings.desc": "Perfil y granja",
  "more.subscription": "Suscripción",
  "more.subscription.desc": "Gestiona tu plan",
  "more.batches": "Lotes",
  "more.batches.desc": "Lotes de peces",
  "more.finance": "Finanzas",
  "more.finance.desc": "Resultados y registros",
  "more.marketplace": "Mercado",
  "more.marketplace.desc": "Comprar y vender",
  "more.sales": "Ventas",
  "more.sales.desc": "Compradores y entregas",
  "more.listings": "Mis anuncios",
  "more.listings.desc": "Artículos del mercado",
  "more.ai": "Predicciones IA",
  "more.ai.desc": "Cosecha y costos",
  "more.growth": "Crecimiento",
  "more.growth.desc": "Peso, longitud y curva",
  "more.water": "Calidad del agua",
  "more.water.desc": "Lecturas del estanque",
  "more.feeding": "Alimentación",
  "more.feeding.desc": "Registros de alimento",
  "more.health": "Salud",
  "more.health.desc": "Enfermedad y tratamiento",
  "more.notifications": "Notificaciones",
  "more.notifications.desc": "Preferencias de alertas",
  "more.security": "Seguridad",
  "more.security.desc": "Contraseña y 2FA",
  "more.help": "Ayuda",
  "more.help.desc": "FAQ y contacto",

  "worker.view": "Vista de trabajador",
  "worker.activeBatches": "Lotes activos",
  "worker.feedingsToday": "Alimentaciones hoy",
  "worker.ponds": "Estanques",
  "worker.todaysTasks": "Tareas de hoy",
  "worker.noBatches": "Aún no hay lotes activos asignados.",
  "worker.water": "Agua",
  "worker.health": "Salud",
  "worker.feed": "Alimento",
  "worker.batches": "Lotes",
};

const pt: Dict = {
  "nav.home": "Início",
  "nav.batches": "Lotes",
  "nav.finance": "Finanças",
  "nav.market": "Mercado",
  "nav.more": "Mais",
  "nav.feed": "Ração",
  "nav.health": "Saúde",
  "nav.console": "Console",
  "nav.users": "Usuários",
  "nav.moderate": "Moderação",
  "nav.tickets": "Tickets",

  "common.loading": "Carregando...",
  "common.welcome": "Bem-vindo",
  "common.save": "Salvar alterações",
  "common.saving": "Salvando...",
  "common.language": "Idioma",
  "common.languageDesc": "Escolha o idioma do app e das respostas da IA",

  "more.title": "Mais",
  "more.subtitle": "Explore todos os recursos",
  "more.section.admin": "Administração",
  "more.section.account": "Conta",
  "more.section.operations": "Operações",
  "more.section.farm": "Fazenda",
  "more.section.preferences": "Preferências",
  "more.adminDashboard": "Painel do administrador",
  "more.adminDashboard.desc": "Visão da plataforma",
  "more.settings": "Configurações",
  "more.settings.desc": "Perfil e fazenda",
  "more.subscription": "Assinatura",
  "more.subscription.desc": "Gerencie seu plano",
  "more.batches": "Lotes",
  "more.batches.desc": "Lotes de peixes",
  "more.finance": "Finanças",
  "more.finance.desc": "Resultados e registros",
  "more.marketplace": "Mercado",
  "more.marketplace.desc": "Comprar e vender",
  "more.sales": "Vendas",
  "more.sales.desc": "Compradores e entregas",
  "more.listings": "Meus anúncios",
  "more.listings.desc": "Itens do mercado",
  "more.ai": "Previsões de IA",
  "more.ai.desc": "Colheita e custos",
  "more.growth": "Crescimento",
  "more.growth.desc": "Peso, comprimento e curva",
  "more.water": "Qualidade da água",
  "more.water.desc": "Leituras do tanque",
  "more.feeding": "Alimentação",
  "more.feeding.desc": "Registros de ração",
  "more.health": "Saúde",
  "more.health.desc": "Doenças e tratamento",
  "more.notifications": "Notificações",
  "more.notifications.desc": "Preferências de alertas",
  "more.security": "Segurança",
  "more.security.desc": "Senha e 2FA",
  "more.help": "Ajuda",
  "more.help.desc": "FAQ e contato",

  "worker.view": "Visão do trabalhador",
  "worker.activeBatches": "Lotes ativos",
  "worker.feedingsToday": "Alimentações hoje",
  "worker.ponds": "Tanques",
  "worker.todaysTasks": "Tarefas de hoje",
  "worker.noBatches": "Nenhum lote ativo atribuído ainda.",
  "worker.water": "Água",
  "worker.health": "Saúde",
  "worker.feed": "Ração",
  "worker.batches": "Lotes",
};

const DICTS: Record<Lang, Dict> = { en, sw, fr, es, pt };

const STORAGE_KEY = "aquasmart.lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && DICTS[saved]) return saved;
    const nav = navigator.language?.slice(0, 2) as Lang;
    if (nav && DICTS[nav]) return nav;
  } catch {
    /* ignore */
  }
  return "en";
}

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  langName: string;
};

const I18nContext = createContext<I18nValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Keep the language in sync with the signed-in user's profile so it survives
  // logins on any device, not just this browser.
  useEffect(() => {
    let cancelled = false;

    const syncFromProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data as { preferred_language?: string | null } | null)?.preferred_language as Lang | undefined;
      if (remote && DICTS[remote]) {
        setLangState(remote);
        try {
          localStorage.setItem(STORAGE_KEY, remote);
        } catch {
          /* ignore */
        }
      } else {
        const local = initialLang();
        await supabase.from("profiles").update({ preferred_language: local }).eq("user_id", userId);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) syncFromProfile(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id;
      if (uid) setTimeout(() => syncFromProfile(uid), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) supabase.from("profiles").update({ preferred_language: l }).eq("user_id", uid);
    });
  }, []);

  const t = useCallback((key: string) => DICTS[lang][key] ?? en[key] ?? key, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, langName: LANG_NAMES[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}


export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
