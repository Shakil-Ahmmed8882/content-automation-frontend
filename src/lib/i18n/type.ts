import type enDictionary from "./dictionaries/en.json";

export type DictionaryKey = keyof typeof enDictionary;
export type Dictionary = Record<DictionaryKey, string>;
