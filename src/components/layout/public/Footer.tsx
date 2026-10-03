import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { footerColumns } from "@/routes";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Write once. Publish to LinkedIn and Facebook. See exactly what went
            out — and retry what didn&apos;t.
          </p>
        </div>

        {footerColumns.map((col) => (
          <div key={col.title} className="space-y-4">
            <h3 className="eyebrow font-normal">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.url}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Content Automation</p>
          <p>LinkedIn profiles and Facebook Pages</p>
        </div>
      </div>
    </footer>
  );
}
