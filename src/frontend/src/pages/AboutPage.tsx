import { Smartphone } from "lucide-react";

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          About KMZ Interactive
        </h1>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground leading-relaxed">
          At KMZ Interactive, we don't just build apps — we create digital
          ecosystems. Driven by innovation and fueled by purpose, KMZ
          Interactive is committed to reshaping everyday experiences through
          smart, intuitive technology. With the launch of{" "}
          <span className="font-semibold text-foreground">PHONE BAZAAR</span>,
          we are setting new standards in how users buy, sell, and engage in the
          mobile world.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Ownership
        </h2>
        <p className="text-foreground font-semibold">Ali Haider Aftab</p>
        <p className="text-muted-foreground">KMZ INTERACTIVE</p>
      </div>
    </div>
  );
}
