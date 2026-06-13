
// import { Injectable, Logger } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { firstValueFrom } from 'rxjs';
// import { HfInference } from '@huggingface/inference';
// import { ConfigService } from '@nestjs/config';
// import { SupabaseService } from '../supabase/supabase.service';

// @Injectable()
// export class RedditScraperService {
//   private readonly logger = new Logger(RedditScraperService.name);
//   private hf: HfInference;

//   constructor(
//     private readonly httpService: HttpService,
//     private readonly configService: ConfigService,
//     private readonly supabaseService: SupabaseService,
//   ) {
//     const hfToken = this.configService.get<string>('HF_TOKEN');
//     this.hf = new HfInference(hfToken);
//   }

//   async runIngestionPipeline(subreddit: string, limit = 15) {
//     try {
//       // Step A: Fetch and Chunk the Reddit Data
//       const rawChunks = await this.fetchSubredditDocs(subreddit, limit);
      
//       this.logger.log(`Starting generation of vector embeddings for ${rawChunks.length} chunks...`);

//       for (const chunk of rawChunks) {
//         // Step B: Send text to Hugging Face to get vector array [0.12, -0.44, 0.09...]
//         const embeddingResult = await this.hf.featureExtraction({
//           model: 'sentence-transformers/all-MiniLM-L6-v2',
//           inputs: chunk.content,
//         });

//         // Ensure the data format from Hugging Face is a pure array of numbers
//         const embeddingVector = Array.isArray(embeddingResult) ? embeddingResult : Object.values(embeddingResult);

//         // Step C: Save directly to Supabase table
//         const { error } = await this.supabaseService.getClient()
//           .from('reddit_chunks')
//           .insert({
//             content: chunk.content,
//             metadata: chunk.metadata,
//             embedding: embeddingVector, // Storing vector safely in pgvector!
//           });

//         if (error) {
//           this.logger.error(`Failed to insert into Supabase: ${error.message}`);
//         }
//       }

//       this.logger.log(`🎉 Pipeline Complete! Cooled off and successfully ingested r/${subreddit}.`);
//     } catch (err: any) {
//       this.logger.error(`Pipeline failure: ${err.message}`);
//     }
//   }

// //   private async fetchSubredditDocs(subreddit: string, limit: number): Promise<Array<{ content: string; metadata: any }>> {
// //     const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
// //     const response = await firstValueFrom(
// //       this.httpService.get(url, { headers: { 'User-Agent': 'DevThreadRAG/1.0' } })
// //     );

// //     const posts = response.data.data.children;
// //     const chunksToEmbed: Array<{ content: string; metadata: any }> = [];

// //     for (const post of posts) {
// //       const data = post.data;
// //       if (data.stickied || !data.selftext) continue;

// //       const fullText = `Title: ${data.title}\n\nContent: ${data.selftext}`;
// //       const chunks = this.simpleTextChunker(fullText, 500);

// //       for (const chunk of chunks) {
// //         chunksToEmbed.push({
// //           content: chunk,
// //           metadata: {
// //             title: data.title,
// //             subreddit: subreddit,
// //             url: `https://reddit.com${data.permalink}`,
// //             score: data.score,
// //           },
// //         });
// //       }
// //     }
// //     return chunksToEmbed;
// //   }

// private async fetchSubredditDocs(subreddit: string, limit: number): Promise<Array<{ content: string; metadata: any }>> {
//   const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
  
//   const response = await firstValueFrom(
//     this.httpService.get(url, { 
//       headers: { 
//         // A standard browser User-Agent makes Reddit treat this like a real human visit
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
//       } 
//     })
//   );

//   const posts = response.data.data.children;
//   const chunksToEmbed: Array<{ content: string; metadata: any }> = [];

//   for (const post of posts) {
//     const data = post.data;
//     if (data.stickied || !data.selftext) continue;

//     const fullText = `Title: ${data.title}\n\nContent: ${data.selftext}`;
//     const chunks = this.simpleTextChunker(fullText, 500);

//     for (const chunk of chunks) {
//       chunksToEmbed.push({
//         content: chunk,
//         metadata: {
//           title: data.title,
//           subreddit: subreddit,
//           url: `https://reddit.com${data.permalink}`,
//           score: data.score,
//         },
//       });
//     }
//   }
//   return chunksToEmbed;
// }

//   private simpleTextChunker(text: string, chunkSize: number): string[] {
//     const chunks: string[] = [];
//     let i = 0;
//     while (i < text.length) {
//       chunks.push(text.substring(i, i + chunkSize));
//       i += chunkSize - 50;
//     }
//     return chunks;
//   }
// }



import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HfInference } from '@huggingface/inference';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class RedditScraperService {
  private readonly logger = new Logger(RedditScraperService.name);
  private hf: HfInference;
  private parser: XMLParser;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const hfToken = this.configService.get<string>('HF_TOKEN');
    this.hf = new HfInference(hfToken);
    this.parser = new XMLParser();
  }

  async runIngestionPipeline(subreddit: string, limit = 15) {
    try {
      // Fetch data using the RSS pipeline
      const rawChunks = await this.fetchSubredditRSS(subreddit, limit);
      
      if (rawChunks.length === 0) {
        this.logger.warn(`No valid content chunks extracted from r/${subreddit}. Pipeline stopping.`);
        return;
      }

      this.logger.log(`Generating embeddings and saving ${rawChunks.length} chunks to Supabase...`);

      for (const chunk of rawChunks) {
        // Send chunk text to Hugging Face
        const embeddingResult = await this.hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: chunk.content,
        });

        const embeddingVector = Array.isArray(embeddingResult) ? embeddingResult : Object.values(embeddingResult);

        // Store inside pgvector database table
        const { error } = await this.supabaseService.getClient()
          .from('reddit_chunks')
          .insert({
            content: chunk.content,
            metadata: chunk.metadata,
            embedding: embeddingVector,
          });

        if (error) {
          this.logger.error(`Supabase Insert Error: ${error.message}`);
        }
      }

      this.logger.log(`🎉 Success! Ingested and embedded data from r/${subreddit}.`);
    } catch (err: any) {
      this.logger.error(`Pipeline execution failed: ${err.message}`);
    }
  }

  private async fetchSubredditRSS(subreddit: string, limit: number): Promise<Array<{ content: string; metadata: any }>> {
    // RSS feeds bypass the harsh anti-bot blocks applied to the direct .json endpoints
    const url = `https://www.reddit.com/r/${subreddit}/hot/.rss`;
    
    this.logger.log(`Fetching RSS data stream from r/${subreddit}...`);
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
    );

    const jsonObj = this.parser.parse(response.data);
    const entries = jsonObj.feed?.entry || [];
    const chunksToEmbed: Array<{ content: string; metadata: any }> = [];

    // Safety check if the feed is smaller than the specified limit
    const loopLimit = Math.min(entries.length, limit);

    for (let i = 0; i < loopLimit; i++) {
      const entry = entries[i];
      
      const title = entry.title || 'Untitled Post';
      let rawContent = entry.content || '';

      // Strip out distracting HTML tags often bundled inside RSS data
      if (typeof rawContent === 'object') {
        rawContent = rawContent['#text'] || '';
      }
      const cleanContent = rawContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      if (!cleanContent || cleanContent.length < 30) continue;

      const fullText = `Title: ${title}\n\nDiscussion Content: ${cleanContent}`;
      const chunks = this.simpleTextChunker(fullText, 500);

      for (const chunk of chunks) {
        chunksToEmbed.push({
          content: chunk,
          metadata: {
            title: title,
            subreddit: subreddit,
            url: entry.link?.['@_href'] || entry.id || `https://reddit.com/r/${subreddit}`,
            author: entry.author?.name || 'Anonymous',
          },
        });
      }
    }

    return chunksToEmbed;
  }

  private simpleTextChunker(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.substring(i, i + chunkSize));
      i += chunkSize - 50;
    }
    return chunks;
  }
}