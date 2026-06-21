import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Database, Bot, Cpu, Cloud, Layers, Workflow } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Code Chat Reddit AI" },
      {
        name: "description",
        content:
          "How Code Chat Reddit AI uses RAG, pgvector, Hugging Face embeddings and Groq's Llama-3 to answer dev questions.",
      },
      { property: "og:title", content: "About — Code Chat Reddit AI" },
      {
        property: "og:description",
        content: "RAG over top tech subreddits, refreshed every 6 hours.",
      },
    ],
  }),
  component: AboutPage,
});

const tech = [
  { name: "React", desc: "UI layer", icon: Layers },
  { name: "NestJS", desc: "API & scrapers", icon: Workflow },
  { name: "Supabase", desc: "pgvector store", icon: Database },
  { name: "Hugging Face", desc: "Embeddings", icon: Cpu },
  { name: "Groq", desc: "Llama-3 inference", icon: Bot },
  { name: "Render", desc: "Hosting", icon: Cloud },
];

function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How it <span className="text-primary">works</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            A Retrieval-Augmented Generation pipeline tuned for developer-grade answers grounded in
            real community discussion.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">The Pipeline</h2>
          <ol className="space-y-3 text-sm leading-relaxed">
            <Step
              n={1}
              title="Scrape"
              body="Every 6 hours we pull the top posts and comments from r/reactjs, r/typescript, r/nestjs, and r/nextjs."
            />
            <Step
              n={2}
              title="Clean"
              body="Markdown, HTML, and noise are stripped; threads are split into semantically coherent chunks."
            />
            <Step
              n={3}
              title="Embed"
              body="Each chunk is vectorized using Hugging Face sentence-transformer embeddings."
            />
            <Step
              n={4}
              title="Store"
              body="Vectors live in Supabase via the pgvector extension, indexed for fast similarity search."
            />
            <Step
              n={5}
              title="Retrieve & Generate"
              body="When you ask a question, the most relevant chunks are pulled and passed to Groq's Llama-3 API for hyper-contextual answers — with sources cited."
            />
          </ol>
        </div>

        <h2 className="text-lg font-semibold mt-10 mb-4">Built with</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tech.map(({ name, desc, icon: Icon }) => (
            <div
              key={name}
              className="rounded-xl border border-border bg-surface p-4 hover:border-primary hover:-translate-y-0.5 transition-all"
            >
              <Icon className="size-5 text-primary mb-2" />
              <div className="font-medium text-sm">{name}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <div className="size-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {n}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-muted-foreground">{body}</div>
      </div>
    </li>
  );
}
