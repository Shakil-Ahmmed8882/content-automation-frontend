"use client";

import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function DefaultErrorUI() {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
      <AlertCircle className="size-10 text-[#FF124B]" />
      <p className="font-proxima-nova text-[#141414] text-base font-semibold">
        {t("somethingWentWrong", "Something went wrong")}
      </p>
    </div>
  );
}
