import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { HeroGridBackground } from "./hero-grid-background";
import { BackgroundTerminals } from "./background-terminals";

export function HeroSection(): React.ReactElement {
  return (
    <section className="relative z-[1] h-screen overflow-hidden flex flex-col justify-center items-center text-center px-8">
      <HeroGridBackground />
      <BackgroundTerminals />

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-ink-muted border border-ink-subtle rounded-full text-xs tracking-wide text-surface-dim mb-8 animate-fade-up">
        <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        AI Friendly
      </div>

      <h1 className="text-5xl md:text-[3.815rem] font-bold leading-none tracking-tighter mb-6 animate-fade-up-delay-1">
        Build fast.<br />
        <span className="bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent">
          Ship faster.
        </span>
      </h1>

      <p className="text-xl text-surface-dim max-w-[600px] mb-12 leading-relaxed animate-fade-up-delay-2">
        A production-ready full-stack monorepo boilerplate featuring Next.js 16, Express, PostgreSQL, and Docker. Built for rapid development with modern best practices.
      </p>

      <div className="flex gap-4 animate-fade-up-delay-3 flex-col sm:flex-row">
        <Link href="/login">
          <Button size="lg">
            Start shipping
          </Button>
        </Link>
        <Link href="https://github.com/time2build-ai/time2ship" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="lg" className="gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            See repository
          </Button>
        </Link>
      </div>
    </section>
  );
}
