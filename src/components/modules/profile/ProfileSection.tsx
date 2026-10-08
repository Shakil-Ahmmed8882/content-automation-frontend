import type { ReactNode } from "react";

function sectionId(title: string) {
  return `profile-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const headingId = sectionId(title);
  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-lg bg-card p-5 shadow-card sm:p-6"
    >
      <div className="mb-6 space-y-1">
        <h2 id={headingId} className="text-base tracking-[-0.02em]">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
