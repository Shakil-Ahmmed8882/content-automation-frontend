import { History, Layers, RotateCw, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "One composer, many platforms.",
    body: "Write your post and an optional image once. Choose LinkedIn, Facebook, or both.",
  },
  {
    icon: History,
    title: "Every publish, on the record.",
    body: "See each execution, each platform result, and every attempt — with clear status at a glance.",
  },
  {
    icon: RotateCw,
    title: "Retry what failed.",
    body: "A platform hiccup shouldn't cost you the post. Retry just the failed destinations in one click.",
  },
  {
    icon: ShieldCheck,
    title: "Your tokens stay safe.",
    body: "Connections are encrypted server-side. Disconnect a platform any time and the access goes with it.",
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6">
        <p className="eyebrow">Features</p>
        <h2 className="mt-3 max-w-2xl text-3xl tracking-[-0.04em] sm:text-display-lg">
          Everything between &ldquo;draft&rdquo; and &ldquo;live&rdquo;.
        </h2>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-md bg-card p-6 shadow-card transition-shadow hover:shadow-float"
            >
              <Icon className="size-5 text-muted-foreground" />
              <h3 className="mt-5 text-display-sm tracking-[-0.03em]">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
