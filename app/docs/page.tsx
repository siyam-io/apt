import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  BookOpen,
  Keyboard,
  Key,
  ShieldCheck,
  Send,
  Zap,
  Code2,
  Terminal,
  FileQuestion,
  HelpCircle,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — APT API Workbench",
  description: "User guide, shortcuts, authentication instructions, and API testing reference for APT.",
};

export default function DocsPage() {
  const shortcuts = [
    { keys: "Ctrl + Enter / ⌘ + Enter", action: "Send currently active request" },
    { keys: "Alt + N", action: "Create a new untitled request draft" },
    { keys: "Escape", action: "Close modal dialogs or cancel active prompts" },
    { keys: "Ctrl + S / ⌘ + S", action: "Trigger request save to project/local storage" },
  ];

  const guides = [
    {
      step: "01",
      title: "Immediate Guest Mode",
      desc: "Open `/workbench` directly. You are greeted with an active draft in a local guest workspace. Enter your target endpoint (e.g. `https://jsonplaceholder.typicode.com/todos/1`), select your method (GET, POST, etc.), and click Send. Results are returned immediately.",
    },
    {
      step: "02",
      title: "Adding Query Parameters & Headers",
      desc: "Use the Parameters and Headers tabs in the editor. Each row has a key, value, and an active checkbox. Disabled rows remain in your draft without being sent in the HTTP envelope.",
    },
    {
      step: "03",
      title: "Configuring Authentication",
      desc: "Choose between None, Bearer Token, or Custom API Key Header. For Bearer tokens, enter your JWT or access token. For API keys, specify the header name (e.g., `X-API-Key`) and secret token.",
    },
    {
      step: "04",
      title: "JSON & Text Request Payloads",
      desc: "Under the Body tab, enter raw JSON or text. If valid JSON is detected, APT automatically attaches the `Content-Type: application/json` header for you.",
    },
    {
      step: "05",
      title: "Saving to Cloud Projects",
      desc: "When you want to sync requests across multiple computers, click 'Sign In' or 'Connect Cloud Project'. Create your account, and your collections will be saved to your private PostgreSQL database.",
    },
  ];

  const faqs = [
    {
      q: "Can I use APT without creating an account?",
      a: "Yes! APT was created specifically to eliminate mandatory accounts. Anyone can use the workbench immediately as a guest, and all drafts and history are stored locally in your browser.",
    },
    {
      q: "Can I test endpoints on localhost?",
      a: "When running APT locally (`npm run dev`), you can test any localhost or private IP API. In cloud hosted production, SSRF protections prevent targeting internal server IP addresses.",
    },
    {
      q: "What limits are enforced on requests?",
      a: "1 MB max request body, 2 MB max decoded upstream response, 4 MB serialized response envelope, and up to 45 seconds timeout.",
    },
    {
      q: "Are my passwords and API keys safe?",
      a: "Yes. Sensitive header keys (authorization, cookie, token, secret, password, api-key) are automatically filtered out when saving requests to projects.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center">
          <span className="chamfer-xs border border-accent/40 bg-accent/10 px-4 py-1.5 font-accent text-xs uppercase tracking-[0.3em] text-accent">
            // Developer Reference Manual
          </span>
          <h1 className="mt-6 font-display text-4xl font-black uppercase tracking-wider text-foreground sm:text-5xl">
            Documentation & Guides
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
            Everything you need to know about crafting requests, handling auth, and managing collections.
          </p>
        </div>

        {/* Quickstart Workflow */}
        <section className="mt-16">
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            <Send className="size-5 text-accent" />
            <span>Workbench Quickstart</span>
          </h2>

          <div className="mt-8 space-y-4">
            {guides.map((g, idx) => (
              <div
                key={idx}
                className="chamfer border border-border bg-card/60 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="chamfer-xs grid size-9 shrink-0 place-items-center bg-accent/10 border border-accent/30 font-accent text-xs font-bold text-accent">
                    {g.step}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      {g.title}
                    </h3>
                    <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                      {g.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="mt-16">
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            <Keyboard className="size-5 text-accent" />
            <span>Keyboard Accelerators</span>
          </h2>

          <div className="chamfer mt-6 border border-border bg-card/60 p-6">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border/80 pb-3 text-muted-foreground">
                  <th className="py-2.5 font-accent uppercase tracking-wider">Keystroke</th>
                  <th className="py-2.5 font-accent uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {shortcuts.map((sc, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="py-3 font-bold text-accent">
                      <kbd className="chamfer-xs border border-border bg-muted px-2 py-1">
                        {sc.keys}
                      </kbd>
                    </td>
                    <td className="py-3 text-foreground/90">{sc.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-16">
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            <HelpCircle className="size-5 text-accent" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="chamfer border border-border bg-card/60 p-6">
                <h3 className="font-display text-sm font-bold text-foreground">
                  {faq.q}
                </h3>
                <p className="mt-2.5 font-mono text-xs leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Launch Banner */}
        <div className="mt-16 text-center">
          <Link
            href="/workbench"
            className="chamfer inline-flex items-center gap-2 border border-accent bg-accent px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-background hover:bg-accent/90 glow-accent"
          >
            <Zap className="size-4 fill-current" />
            <span>Open Workbench & Test Now</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
