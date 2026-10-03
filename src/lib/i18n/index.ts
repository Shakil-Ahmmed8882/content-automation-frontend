import enDictionary from "./dictionaries/en.json";
import type { Dictionary, DictionaryKey } from "./type";

export type { Dictionary, DictionaryKey } from "./type";

const dictionary = enDictionary as Dictionary;

/**
 * Single-locale (English) translation helper. Same call shape as the source
 * project's `useTranslation`, so the copied UI blocks work unchanged; a real
 * locale provider can replace this file later without touching the blocks.
 */
export function useTranslation() {
  const t = (key: DictionaryKey, fallback?: string): string =>
    dictionary[key] ?? fallback ?? key;
  return { t, dictionary };
}
