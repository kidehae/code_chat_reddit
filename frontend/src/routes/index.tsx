import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Chat } from "@/components/Chat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Code Chat Reddit AI — Chat" },
      {
        name: "description",
        content:
          "Ask anything about React, TypeScript, NestJS or Next.js. Answers powered by Reddit RAG + Llama-3.",
      },
      { property: "og:title", content: "Code Chat Reddit AI" },
      {
        property: "og:description",
        content: "Conversational AI grounded in the latest top tech subreddit threads.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Chat />
    </AppShell>
  ),
});
