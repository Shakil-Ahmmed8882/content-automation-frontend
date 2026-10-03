"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { FacebookIcon, LinkedInIcon } from "@/components/brand/PlatformIcons";
import { Button } from "@/components/ui/button";
import { MarketingAction } from "./MarketingAction";

export default function Hero() {
  const reducedMotion = useReducedMotion();
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="mesh-gradient pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-80"
      />
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mx-auto flex max-w-[1400px] flex-col items-center px-4 pt-24 pb-28 text-center sm:px-6 sm:pt-32"
      >
        <span className="mb-8 inline-flex items-center gap-2 rounded-full bg-link-bg-soft px-3 py-1.5 text-sm text-link">
          <span className="size-1.5 rounded-full bg-link" />
          Publish to LinkedIn and Facebook Pages
        </span>

        <h1 className="max-w-4xl text-4xl leading-[1.05] tracking-[-0.05em] sm:text-display-xl">
          Write once. Publish everywhere.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Compose a post a single time, pick where it goes, and ship it with one
          click. Every publish is tracked, and anything that fails can be
          retried — without rewriting a word.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <MarketingAction />
          <Button asChild size="pill" variant="outline">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-muted-foreground">
          <span className="eyebrow">Publishes to</span>
          <span className="flex items-center gap-2 text-sm">
            <LinkedInIcon className="size-5" /> LinkedIn
          </span>
          <span className="flex items-center gap-2 text-sm">
            <FacebookIcon className="size-5" /> Facebook Page
          </span>
        </div>
      </motion.div>
    </section>
  );
}
