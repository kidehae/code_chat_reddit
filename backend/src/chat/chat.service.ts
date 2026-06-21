import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { HfInference } from '@huggingface/inference';
import Groq from 'groq-sdk';

type AssistantResponse = {
  notice: string;
  explanation_points: string[];
  sources: string[];
};

type ParsedSource = { title: string; url: string };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private hf: HfInference;
  private groq: Groq;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.hf = new HfInference(this.configService.get<string>('HF_TOKEN'));
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

//   async answerQuestion(userQuestion: string): Promise<string> {
//     try {
//       this.logger.log(`Processing question: "${userQuestion}"`);

//       // 1. Convert user question into a 384-dimension vector embedding
//       const queryEmbeddingResult = await this.hf.featureExtraction({
//         model: 'sentence-transformers/all-MiniLM-L6-v2',
//         inputs: userQuestion,
//       });

//       const queryVector = Array.isArray(queryEmbeddingResult) 
//         ? queryEmbeddingResult 
//         : Object.values(queryEmbeddingResult);

//       // 2. Query Supabase RPC for matching records (threshold 0.2, top 3 results)
//       const { data: matchedChunks, error } = await this.supabaseService.getClient()
//         .rpc('match_reddit_chunks', {
//           query_embedding: queryVector,
//           match_threshold: 0.2,
//           match_count: 3,
//         });

//       if (error) {
//         throw new Error(`Supabase search failed: ${error.message}`);
//       }

//       // 3. Compile matched text into custom context strings
//       const contextText = matchedChunks && matchedChunks.length > 0
//         ? matchedChunks.map((c: any) => `[Source: ${c.metadata.title}]: ${c.content}`).join('\n\n')
//         : 'No relevant Reddit discussions found.';

//       this.logger.log(`Found ${matchedChunks?.length || 0} matching document chunks for context.`);

//       // 4. Send matched text + question to Groq using standard LLama-3
//     // ... inside your chatCompletion call in src/chat/chat.service.ts
// const chatCompletion = await this.groq.chat.completions.create({
//   messages: [
//     {
//       role: 'system',
//       content: `You are a helpful assistant analyzing developer discussions from Reddit...`,
//     },
//     {
//       role: 'user',
//       content: userQuestion,
//     },
//   ],
//   model: 'llama-3.1-8b-instant', // 👈 Updated to Groq's fast supported model
//   temperature: 0.5,
// });
//       return chatCompletion.choices[0]?.message?.content || 'No response generated.';

//     } catch (err: any) {
//       this.logger.error(`Chat Engine error: ${err.message}`);
//       return `Sorry, I encountered an error while processing that request: ${err.message}`;
//     }
//   }

async answerQuestion(userQuestion: string): Promise<string> {
  try {
    this.logger.log(`Processing question: "${userQuestion}"`);

    // 1. Get embedding vector from Hugging Face
    const queryEmbeddingResult = await this.hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: userQuestion,
    });

    const queryVector = (Array.isArray(queryEmbeddingResult) 
      ? queryEmbeddingResult.flat(Infinity) 
      : Object.values(queryEmbeddingResult)) as number[];

    // 2. Query Supabase RPC (using a low threshold to ensure we grab these rows)
    const { data: matchedChunks, error } = await this.supabaseService.getClient()
      .rpc('match_reddit_chunks', {
        query_embedding: queryVector,
        match_threshold: 0.0, 
        match_count: 5, // Increased to 5 to gather more context from multiple threads
      });

    if (error) {
      throw new Error(`Supabase search failed: ${error.message}`);
    }

    // 3. Format the context and preserve the source metadata (title & url)
    let contextText = '';
    if (matchedChunks && matchedChunks.length > 0) {
      contextText = matchedChunks
        .map((c: any) => {
          const title = c.metadata?.title || 'Unknown Thread';
          const urlKey = c.metadata?.url || '';
          const fullUrl = urlKey ? `https://reddit.com/comments/${urlKey.replace('t3_', '')}` : 'N/A';
          
          return `[Source: "${title}" | Link: ${fullUrl}]\nContent: ${c.content}`;
        })
        .join('\n\n---\n\n');
    } else {
      contextText = 'NO_DATABASE_CONTEXT_AVAILABLE';
    }

    this.logger.log(`Found ${matchedChunks?.length || 0} matching document chunks for context.`);

    // 4. Send to Groq with strict structural layout instructions
    const chatCompletion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an advanced Reddit Data Analyst Assistant. 
Your goal is to answer the user's question by analyzing the provided Reddit discussions.

Follow these output formatting rules strictly:
1. Start with a clear introductory paragraph summarizing your overall findings from the discussions.
2. Break down the specific details, arguments, or facts into structured bullet points with bold highlights.
3. For EVERY claim, fact, or bullet point you make, you MUST explicitly state its source using the exact [Source: "Thread Title" | Link: URL] provided in the context.
4. DATABASE MISMATCH / EMPTY CONTEXT RULE:
⚠️ EMPTY CONTEXT / FALLBACK RULE (CRITICAL):
- Evaluate the provided Context text before answering.
- If the Context is blank, empty, or unrelated to the user's technical question, you MUST start your response with this exact single sentence: "**Notice:** I couldn't find any direct discussions or threads about this topic in my local Reddit database."
- Right after that sentence, provide a high-level architectural or conceptual bulleted overview of how the technology works using your core knowledge.
- CRITICAL: Do NOT generate any markdown code blocks (\`\`\`).
- CRITICAL: Do NOT create a "Sources", "References", or link section at the bottom if the context is empty. Do NOT invent, guess, or fabricate any fake Reddit links, thread titles, or URLs. If the database doesn't have it, your output must contain ZERO links.
- You must respond ONLY with a JSON object matching this exact TypeScript interface:
interface AssistantResponse {
  notice: string; // If context is empty/unrelated, set to: "**Notice:** I couldn't find any direct discussions or threads about this topic in my local Reddit database." Otherwise leave empty "".
  explanation_points: string[]; // High-level conceptual, architectural bullet points explaining the concept. Absolutely NO code snippets, NO backticks, and NO code syntax allowed here.
  sources: string[]; // Array of strings matching [Source: "Thread Title" | Link: URL]. Leave empty array [] if context is empty. Do NOT invent fake links.
${contextText}`,
        },
        {
          role: 'user',
          content: userQuestion,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2, // Low temperature keeps it factual to the text
    });

    return chatCompletion.choices[0]?.message?.content || 'No response generated.';

  } catch (err: any) {
    this.logger.error(`Chat Engine error: ${err.message}`);
    return `Error: ${err.message}`;
  }
}

}