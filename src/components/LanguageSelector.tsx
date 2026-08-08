import { Globe } from "lucide-react";
import { LANGUAGES, useI18n, Lang } from "@/i18n";

export default function LanguageSelector() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="bg-card rounded-2xl shadow-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{t("common.language")}</p>
          <p className="text-xs text-muted-foreground">{t("common.languageDesc")}</p>
        </div>
      </div>
      <select
        aria-label={t("common.language")}
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.native}
          </option>
        ))}
      </select>
    </div>
  );
}
