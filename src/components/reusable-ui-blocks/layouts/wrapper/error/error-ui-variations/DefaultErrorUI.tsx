"use client";

import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function DefaultErrorUI() {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="w-full min-h-full flex flex-col items-center justify-center gap-3 px-8 py-20 text-center"
    >
      <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
      <p className="text-foreground text-base font-semibold">
        {t("somethingWentWrong", "Something went wrong")}
      </p>
    </div>
  );
}
