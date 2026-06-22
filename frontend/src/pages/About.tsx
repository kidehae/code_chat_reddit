export default function About() {
  return (
    <div className="flex-1 flex flex-col w-full">
      <section className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            About Code Chat Reddit <span className="text-primary">AI</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Powered by cutting-edge AI and community knowledge
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3">What is this?</h2>
          <p className="text-foreground leading-relaxed opacity-90">
            Code Chat Reddit AI is a conversational tool that lets you ask questions about React, TypeScript, 
            NestJS, and Next.js — and get answers grounded in real discussions from Reddit's top programming 
            communities. Using advanced retrieval-augmented generation (RAG), the AI searches millions of Reddit 
            posts and comments to provide answers backed by actual community wisdom.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">How does it work?</h2>
          <ul className="space-y-2 text-foreground opacity-90">
            <li>🔍 <strong>Retrieval:</strong> Your question is converted to embeddings and searched against a vector database of Reddit content.</li>
            <li>🤖 <strong>Generation:</strong> The top relevant Reddit posts are sent to Llama-3 to generate a coherent, sourced answer.</li>
            <li>📚 <strong>Sources:</strong> Each answer includes links to the original Reddit discussions that informed it.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Tech Stack</h2>
          <ul className="space-y-1 text-sm text-foreground opacity-80">
            <li>• <strong>Frontend:</strong> React, TypeScript, Vite, Tailwind CSS</li>
            <li>• <strong>Backend:</strong> NestJS, Groq API (Llama-3), Supabase (vector search)</li>
            <li>• <strong>Data:</strong> Reddit posts from r/reactjs, r/typescript, r/nestjs, r/nextjs</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Limitations</h2>
          <ul className="space-y-1 text-sm text-foreground opacity-80">
            <li>• Answers are only as good as the Reddit posts in the database</li>
            <li>• May occasionally hallucinate or misinterpret context</li>
            <li>• Limited to the four supported subreddits</li>
            <li>• Backend runs on free tier (may be slow)</li>
          </ul>
        </section>

        <section className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Built as an experiment in combining community knowledge with modern LLMs.
          </p>
        </section>
      </div>
    </div>
  );
}
