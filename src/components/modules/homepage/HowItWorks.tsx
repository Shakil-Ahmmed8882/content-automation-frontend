const steps = [
  {
    n: "01",
    title: "Connect",
    body: "Link your LinkedIn profile and Facebook Page with a secure sign-in.",
  },
  {
    n: "02",
    title: "Write",
    body: "Compose your post, add an image, and preview it before it goes out.",
  },
  {
    n: "03",
    title: "Publish",
    body: "Hit publish. Watch each platform report back in real time.",
  },
] as const;

const logLines = [
  { mark: "$", tone: "text-foreground", text: "publish post_8f21" },
  { mark: "✓", tone: "text-success", text: "linkedin   published in 1.2s" },
  {
    mark: "!",
    tone: "text-warning",
    text: "facebook   failed — retrying (2/3)",
  },
  { mark: "✓", tone: "text-success", text: "facebook   published in 0.9s" },
] as const;

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-t border-border bg-canvas-soft"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 max-w-2xl text-3xl tracking-[-0.04em] sm:text-display-lg">
          Three steps. No tab-hopping.
        </h2>

        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="rounded-lg bg-background p-8 shadow-float">
              <span className="font-mono text-xs text-muted-foreground">
                {s.n}
              </span>
              <h3 className="mt-6 text-display-md tracking-[-0.04em]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 overflow-hidden rounded-md bg-background p-6 shadow-card">
          <p className="eyebrow mb-4">publish.log</p>
          <div className="space-y-1 overflow-x-auto font-mono text-[13px] leading-5 text-muted-foreground">
            {logLines.map((line) => (
              <p key={line.text} className="whitespace-pre">
                <span className={line.tone}>{line.mark}</span> {line.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
