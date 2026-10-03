import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata = { title: "Sign up" };

// Placeholder: the real form ships with the auth-ui change (openspec/changes/auth-ui).
export default function RegisterPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <Logo />
      <div className="w-full max-w-sm rounded-lg bg-card p-8 text-center shadow-float">
        <h1 className="text-display-sm tracking-[-0.03em]">Sign up</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This screen arrives with the authentication slice.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-link hover:underline"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
