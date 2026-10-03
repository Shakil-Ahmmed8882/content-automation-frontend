import type { AuthProvider } from "@/types/user.type";

export function formatDate(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function providerLabel(provider: AuthProvider) {
  if (provider === "CREDENTIALS") return "Email & password";
  if (provider === "GOOGLE") return "Google";
  return provider;
}
