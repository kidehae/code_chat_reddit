import { useEffect, useRef, useState } from "react";
import { Send, ChevronDown, ExternalLink, AlertCircle, Sparkles, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = "https://code-chat-reddit-1.onrender.com";

type Source = { title: string; url: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

type AssistantResponse = {
  notice: string;
  explanation_points: string[];
  sources: string[];
};

type ParsedAssistantResponse = {
  answer: string;
  sources: Source[];
};

type Pending = { id: string; coldStart: boolean } | null;

export function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Wake the Render free-tier dyno early so the first real request doesn't get dropped.
    fetch(`${API_BASE}/`, { method: "GET", mode: "no-cors" }).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 90_000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(t);
        return res;
      } catch (e) {
        lastErr = e;
        // brief backoff before retrying (cold start / transient network)
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Network error");
  }

  async function submit(retryQuestion?: string) {
    const isRetry = typeof retryQuestion === "string";
    const q = (isRetry ? retryQuestion : input).trim();
    if (!q || pending) return;
    setError(null);
    setLastQuestion(q);
    if (!isRetry) {
      const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: q };
      setMessages((m) => [...m, userMsg]);
      setInput("");
    }
    const pendId = crypto.randomUUID();
    setPending({ id: pendId, coldStart: false });

    const coldTimer = setTimeout(() => {
      setPending((p) => (p ? { ...p, coldStart: true } : p));
    }, 5000);

    try {
      const res = await fetchWithRetry(`${API_BASE}/chat?question=${encodeURIComponent(q)}`);
      clearTimeout(coldTimer);

      if (!res.ok) {
        if (res.status === 400) {
          let msg = "Invalid input.";
          try {
            const body = await res.json();
            if (Array.isArray(body?.message)) msg = body.message.join(" • ");
            else if (typeof body?.message === "string") msg = body.message;
          } catch {}
          setError(msg);
          setPending(null);
          return;
        }
        throw new Error(`Request failed (${res.status})`);
      }

      const data = (await res.json()) as { question: string; answer: string; sources?: Source[] };
      const parsed = parseAssistantResponse(data.answer ?? "");
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: parsed.answer,
          sources: parsed.sources.length > 0 ? parsed.sources : data.sources,
        },
      ]);
    } catch (e) {
      clearTimeout(coldTimer);
      const msg =
        e instanceof Error && (e.name === "AbortError" || /fetch/i.test(e.message))
          ? "Couldn't reach the server. It may still be waking up — please try again in a few seconds."
          : e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setPending(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full bella">
      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 text-center uoo">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
            <Sparkles className="size-3.5" />
            Powered by Llama-3 + Reddit RAG
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Code Chat Reddit <span className="text-primary">AI</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Ask anything about React, TypeScript, NestJS or Next.js — answers grounded in the latest
            top subreddit threads.
          </p>
        </div>
      </section>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {messages.length === 0 && !pending && <EmptyState onPick={(q) => setInput(q)} />}
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {pending && <AssistantSkeleton coldStart={pending.coldStart} />}
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border bg-surface/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {error && (
            <div className="mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              {lastQuestion && (
                <button
                  onClick={() => submit(lastQuestion)}
                  disabled={!!pending}
                  className="shrink-0 inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 px-2 py-1 text-xs font-medium transition disabled:opacity-50"
                >
                  <RotateCw className="size-3" />
                  Retry
                </button>
              )}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-primary transition-colors shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Ask r/reactjs anything..."
              className="flex-1 resize-none bg-transparent outline-none text-sm py-1.5 max-h-40"
              disabled={!!pending}
            />
            <button
              onClick={() => submit()}
              disabled={!input.trim() || !!pending}
              aria-label="Send"
              className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const samples = [
    "What's the consensus on React Server Components in 2026?",
    "Best NestJS folder structure for large APIs?",
    "TypeScript: when should I use `unknown` over `any`?",
    "Next.js App Router vs Pages Router — what do devs prefer?",
  ];
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground mb-4">Try one of these to get started</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left text-sm rounded-xl border border-border bg-surface hover:border-primary hover:bg-accent/40 px-3 py-2.5 transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary text-primary-foreground px-4 py-2.5 text-sm shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        r/
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-md bg-surface border border-border px-4 py-3 text-sm prose-reddit">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>
        {msg.sources && msg.sources.length > 0 && <SourcesAccordion sources={msg.sources} />}
      </div>
    </div>
  );
}

function SourcesAccordion({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
      >
        <span>📚 Sources Used ({sources.length})</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="border-t border-border divide-y divide-border">
          {sources.map((s, i) => (
            <li key={i}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 px-3 py-2 text-xs hover:bg-accent/50 transition-colors"
              >
                <ExternalLink className="size-3.5 shrink-0 mt-0.5 text-primary" />
                <span className="truncate">{s.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssistantSkeleton({ coldStart }: { coldStart: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        r/
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="rounded-2xl rounded-tl-md bg-surface border border-border px-4 py-3 space-y-2">
          <div className="h-3 w-3/4 rounded shimmer" />
          <div className="h-3 w-full rounded shimmer" />
          <div className="h-3 w-2/3 rounded shimmer" />
        </div>
        {coldStart && (
          <div className="text-xs text-primary font-medium px-1">
            Searching...
          </div>
        )}
      </div>
    </div>
  );
}

function parseAssistantResponse(raw: string): ParsedAssistantResponse {
  const trimmed = raw.trim();
  if (!trimmed) return { answer: '', sources: [] };

  const parsed = tryParseAssistantResponse(trimmed);
  if (parsed) return parsed;

  return { answer: trimmed, sources: [] };
}

function tryParseAssistantResponse(raw: string): ParsedAssistantResponse | null {
  const jsonLike = extractJsonLikeBody(raw);

  try {
    const parsedJson = JSON.parse(jsonLike) as AssistantResponse;
    if (
      typeof parsedJson.notice === 'string' &&
      Array.isArray(parsedJson.explanation_points) &&
      Array.isArray(parsedJson.sources)
    ) {
      return {
        answer: buildAnswer(parsedJson.notice, parsedJson.explanation_points),
        sources: parseSourceArray(parsedJson.sources),
      };
    }
  } catch {
    // Fallback to regex parsing for non-strict JSON
  }

  const notice = extractStringField(jsonLike, 'notice');
  const explanationPoints = extractStringArray(jsonLike, 'explanation_points');
  const sourceStrings = extractStringArray(jsonLike, 'sources');
  if (!notice && explanationPoints.length === 0 && sourceStrings.length === 0) {
    return null;
  }

  return {
    answer: buildAnswer(notice, explanationPoints),
    sources: parseSourceArray(sourceStrings),
  };
}

function extractJsonLikeBody(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start !== -1 && end > start ? text.slice(start, end + 1) : text;
}

function extractStringField(text: string, fieldName: string): string {
  const regex = new RegExp(`${fieldName}\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^,\n\r\]}]+))`, 'i');
  const match = regex.exec(text);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '').trim() : '';
}

function extractStringArray(text: string, fieldName: string): string[] {
  const regex = new RegExp(`${fieldName}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i');
  const match = regex.exec(text);
  if (!match) return [];
  const rawArray = match[1];
  const itemRegex = /"([^"]*)"|'([^']*)'|([^,\n\r]+)/g;
  const results: string[] = [];
  let item: RegExpExecArray | null;
  while ((item = itemRegex.exec(rawArray)) !== null) {
    const value = (item[1] ?? item[2] ?? item[3] ?? '').trim();
    if (value) results.push(value.replace(/^[\-•\s]+/, '').trim());
  }
  return results;
}

function buildAnswer(notice: string, points: string[]): string {
  const parts: string[] = [];
  if (notice) parts.push(notice);
  if (points.length > 0) parts.push(points.map((point) => `- ${point}`).join('\n'));
  return parts.length > 0 ? parts.join('\n\n') : '';
}

function parseSourceArray(rawSources: string[]): Source[] {
  const sources: Source[] = [];
  const regex = /\[Source:\s*"([^"]+)"\s*\|\s*Link:\s*(https?:\/\/[^\]]+)\]/g;
  for (const raw of rawSources) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw)) !== null) {
      sources.push({ title: match[1].trim(), url: match[2].trim() });
    }
  }
  return sources;
}
